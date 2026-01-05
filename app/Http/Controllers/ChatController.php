<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $conversations = Conversation::where('user_id', $request->user()->id)
            ->get(['id', 'name', 'phone_number']);

        return Inertia::render('chat/index', [
            'conversations' => [],
        ]);
    }
}
