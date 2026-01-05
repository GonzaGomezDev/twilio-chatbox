<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiKeyController extends Controller
{
    public function index(Request $request): Response
    {
        $twilio = [
            'account_sid' => 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'auth_token' => '••••••••••••••••••••••••••••••••',
            'messaging_service_sid' => 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'from_number' => '+1 (555) 123-4567',
        ];

        return Inertia::render('api-keys/index', [
            'twilio' => $twilio,
        ]);
    }
}
