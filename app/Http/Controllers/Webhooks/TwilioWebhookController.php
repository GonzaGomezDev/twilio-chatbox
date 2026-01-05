<?php

namespace App\Http\Controllers\Webhooks;

use App\DTO\MessageData;
use App\Events\MessageReceived;
use App\Helpers\FileManagement;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
use App\Services\TwilioService;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TwilioWebhookController extends Controller
{
    public function messageWebhook(Request $request, CampaignService $campaignService)
    {
        $validated = $request->validate([
            'From' => 'required|string',
            'Body' => 'nullable|string',
            'NumMedia' => 'nullable|integer',
        ]);

        $from = $validated['From'];
        $body = $validated['Body'] ?? '';

        $conversation = Conversation::firstOrCreate(
            ['phone_number' => $from],
            [
                'user_id' => User::query()->value('id'),
                'name' => null,
            ]
        );

        $mediaData = null;

        if (array_key_exists('NumMedia', $validated) && $validated['NumMedia'] > 0) {
            Log::info("SMS: {$conversation->id} has media content: " . $validated['NumMedia']);
            $mediaData = ['media' => []];
            try {
                for ($i=0; $i < $validated['NumMedia']; $i++) {
                    $mediaUrl = $request->input("MediaUrl{$i}");
                    $mediaType = $request->input("MediaContentType{$i}");
                    Log::info("SMS: Media URL {$i}: {$mediaUrl}, Type: {$mediaType}");
                    $fileExtension = FileManagement::mime2ext($mediaType);
                    $mediaFilename = basename($mediaUrl) . '.' . $fileExtension;

                    // Download the media file
                    $response = Http::withBasicAuth(config('services.twilio.sid'), config('services.twilio.token'))->get($mediaUrl);
                    if ($response->successful()) {
                        // Save in public disk
                        Storage::disk('public')->put("/attachments/{$mediaFilename}", $response->body());
                        $attachmentPath = "attachments/{$mediaFilename}";
                        $mediaData['media'][] = [
                            'url' => Storage::url($attachmentPath),
                            'type' => $mediaType,
                        ];
                    } else {
                        Log::error("SMS: Failed to download media file from {$mediaUrl}");
                    }
                }
            } catch (\Throwable $th) {
                Log::error("SMS: Error saving media content: {$th->getMessage()}");
            }
        }

        $data = MessageData::create(
            $conversation->id,
            $body,
            $mediaData ? json_encode($mediaData) : null,
            false
        );

        $message = $conversation->messages()->create($data->toArray());

        // Broadcast the message received event
        event(new MessageReceived($conversation, $message));

        // Mark campaign contact as replied if we have one for this number
        $campaignService->recordReplyForNumber($from);

        $keywords = ['appointment', 'schedule', 'book', 'meeting', 'calendly'];

        if (in_array(strtolower($body), $keywords)) {
            try {
                Log::info("SMS: Detected keywords in message body: {$body}");
                $calendlyLink = config('app.calendly_link', 'https://calendly.com/gonzalog');
                $responseMessage = "Thanks for your message, you can book a time with me here: {$calendlyLink}";

                $outboundMessage = MessageData::create(
                    $conversation->id,
                    $responseMessage,
                    null,
                    true
                );

                app(TwilioService::class)->sendMessage(
                    $from,
                    $responseMessage
                );

                $outboundMessage = $conversation->messages()->create($outboundMessage->toArray());

                // Broadcast the outbound message
                event(new MessageReceived($conversation, $outboundMessage));
            } catch (\Throwable $th) {
                Log::error("SMS: Error sending Calendly link: {$th->getMessage()}");
            }
        }

        // Return XML
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
                <Response></Response>";
    }
}
