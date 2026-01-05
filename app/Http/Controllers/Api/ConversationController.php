<?php

namespace App\Http\Controllers\Api;

use App\DTO\MessageData;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Services\TwilioService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $conversations = Conversation::where('user_id', $request->user()->id)
            ->get(['id', 'name', 'phone_number']);

        return response()->json($conversations);
    }

    public function show(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);

        $conversation->load('messages');

        return response()->json(['conversation' => $conversation]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'phone_number' => 'required|string',
            'name' => 'nullable|string',
        ]);

        $conversation = Conversation::create([
            'user_id' => $request->user()->id,
            'phone_number' => $data['phone_number'],
            'name' => $data['name'] ?? null,
        ]);

        return response()->json($conversation, 201);
    }

    public function storeMessage(Request $request, Conversation $conversation, TwilioService $twilio)
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'content' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,mp4,quicktime,mpeg',
        ]);

        try {
            $path = null;
            $media = [];
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('attachments', 'public');
                $media[] = asset('storage/'.$path);
            }

            if (! empty($validated['content']) || $media !== []) {
                $twilio->sendMessage(
                    $conversation->phone_number,
                    $validated['content'] ?? '',
                    $media
                );
            }

            $data = MessageData::create(
                $conversation->id,
                $validated['content'] ?? '',
                $path,
                true,
            );

            $message = $conversation->messages()->create($data->toArray());

            return response()->json(['message' => $message], 201);
        } catch (\Exception $ex) {
            return response()->json([
                'error' => 'Failed to send message: '.$ex->getMessage(),
            ], 500);
        }
    }
}
