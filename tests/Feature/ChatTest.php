<?php

use App\\Models\\Conversation;
use App\\Models\\User;
use App\\Services\\TwilioService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to login when visiting chat', function () {
    $this->get('/chat')->assertRedirect('/login');
});

test('authenticated users can view chat page', function () {
    $user = User::factory()->create();
    Conversation::factory()->for($user)->create();

    $this->actingAs($user)->get('/chat')->assertOk();
});

test('api routes are auth protected', function () {
    $user = User::factory()->create();
    $conversation = Conversation::factory()->for($user)->create();

    $this->getJson('/api/conversations')->assertUnauthorized();
    $this->actingAs($user)->getJson('/api/conversations')->assertOk();
    $this->actingAs($user)->getJson('/api/conversations/'.$conversation->id)->assertOk();
});

test('users can create conversations', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/conversations', [
            'phone_number' => '+1234567890',
            'name' => 'Test User',
        ])
        ->assertCreated()
        ->assertJsonPath('phone_number', '+1234567890');
});

test('authenticated users can send messages', function () {
    $user = User::factory()->create();
    $conversation = Conversation::factory()->for($user)->create();

    $twilio = mock(TwilioService::class);
    $twilio->shouldReceive('sendMessage')->once();

    $this->actingAs($user)
        ->postJson('/api/conversations/'.$conversation->id.'/messages', [
            'content' => 'Hello',
        ])
        ->assertCreated()
        ->assertJsonPath('content', 'Hello');
});

test('authenticated users can send messages with attachments', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $conversation = Conversation::factory()->for($user)->create();

    $twilio = mock(TwilioService::class);
    $twilio->shouldReceive('sendMessage')->once();

    $file = UploadedFile::fake()->image('photo.jpg');

    $this->actingAs($user)
        ->post('/api/conversations/'.$conversation->id.'/messages', [
            'attachment' => $file,
        ], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('attachment_path', 'attachments/'.$file->hashName());
});

