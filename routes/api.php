<?php

use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Webhooks\TwilioWebhookController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('conversations', [ConversationController::class, 'store']);
    Route::get('conversations', [ConversationController::class, 'index']);
    Route::get('conversations/{conversation}', [ConversationController::class, 'show']);
    Route::post('conversations/{conversation}/messages', [ConversationController::class, 'storeMessage']);

    // Campaign routes
    Route::get('campaigns/dashboard', [CampaignController::class, 'dashboard']);
    Route::get('campaigns', [CampaignController::class, 'index']);
    Route::post('campaigns', [CampaignController::class, 'store']);
    Route::put('campaigns/{campaign}', [CampaignController::class, 'update']);
    Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy']);
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show']);
    Route::post('campaigns/{campaign}/upload-contacts', [CampaignController::class, 'uploadContacts']);
    Route::post('campaigns/{campaign}/schedule', [CampaignController::class, 'schedule']);
    Route::post('campaigns/{campaign}/start', [CampaignController::class, 'start']);
    Route::post('campaigns/csv-headers', [CampaignController::class, 'getCsvHeaders']);
    Route::get('campaigns/available-variables', [CampaignController::class, 'getAvailableVariables']);
    Route::get('campaigns/timezones', [CampaignController::class, 'getTimezones']);
});

Route::post('webhooks/twilio/message', [TwilioWebhookController::class, 'messageWebhook'])
    ->name('webhooks.twilio.message');
