<?php

namespace App\Services;

use Twilio\Rest\Client;

class TwilioService
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
    }

    public function sendMessage(string $to, string $message = '', array $mediaUrls = []): mixed
    {
        $options = [
            'from' => config('services.twilio.sms.from'),
        ];

        if ($message !== '') {
            $options['body'] = $message;
        }

        if ($mediaUrls !== []) {
            $options['mediaUrl'] = $mediaUrls;
        }

        return $this->client->messages->create($to, $options);
    }
}
