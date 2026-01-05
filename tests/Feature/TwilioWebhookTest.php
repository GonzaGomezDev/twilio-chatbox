<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\post;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('stores an incoming message', function () {
    $user = User::factory()->create();
    $conversation = Conversation::factory()->for($user)->create([
        'phone_number' => '+1234567890',
    ]);

    post('/api/webhooks/twilio', [
        'From' => '+1234567890',
        'Body' => 'Hello',
        'NumMedia' => 0,
    ])->assertCreated();

    expect($conversation->messages()->count())->toBe(1)
        ->and($conversation->messages()->first()->is_outgoing)->toBeFalse();
});

it('stores media from twilio', function () {
    Storage::fake('public');
    Http::fake([
        'https://example.com/image.jpg' => Http::response('image', 200),
    ]);

    $user = User::factory()->create();
    $conversation = Conversation::factory()->for($user)->create([
        'phone_number' => '+1987654321',
    ]);

    post('/api/webhooks/twilio', [
        'From' => '+1987654321',
        'Body' => '',
        'NumMedia' => 1,
        'MediaUrl0' => 'https://example.com/image.jpg',
    ])->assertCreated();

    $message = $conversation->messages()->first();
    expect($message->attachment_path)->not()->toBeNull();
    Storage::disk('public')->assertExists($message->attachment_path);
});
