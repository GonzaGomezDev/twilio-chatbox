<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignContact;
use App\Jobs\SendCampaignMessage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CampaignService
{
    protected $twilioService;

    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }

    public function createCampaign(array $data): Campaign
    {
        return Campaign::create($data);
    }

    public function processCsvUpload(Campaign $campaign, UploadedFile $file, array $fieldMapping): array
    {
        $csvData = $this->parseCsv($file);
        $contacts = [];
        $errors = [];

        foreach ($csvData as $index => $row) {
            $contactData = $this->mapCsvRow($row, $fieldMapping);

            if (!$this->validateContact($contactData)) {
                $errors[] = "Row " . ($index + 2) . ": Invalid phone number or missing required fields";
                continue;
            }

            $contacts[] = $contactData;
        }

        if (!empty($contacts)) {
            $this->saveContacts($campaign, $contacts);
            $campaign->update(['total_contacts' => count($contacts)]);
        }

        return [
            'success' => count($contacts),
            'errors' => $errors,
            'total_processed' => count($csvData)
        ];
    }

    protected function parseCsv(UploadedFile $file): array
    {
        $content = file_get_contents($file->getPathname());
        $lines = explode("\n", $content);
        $headers = str_getcsv(array_shift($lines));

        $data = [];
        foreach ($lines as $line) {
            if (trim($line) === '') continue;

            $row = str_getcsv($line);
            if (count($row) === count($headers)) {
                $data[] = array_combine($headers, $row);
            }
        }

        return $data;
    }

    protected function mapCsvRow(array $row, array $fieldMapping): array
    {
        $contactData = [
            'first_name' => null,
            'last_name' => null,
            'phone_number' => null,
            'email' => null,
            'custom_fields' => []
        ];

        foreach ($fieldMapping as $systemField => $csvField) {
            if ($csvField && isset($row[$csvField])) {
                if (in_array($systemField, ['first_name', 'last_name', 'phone_number', 'email'])) {
                    $contactData[$systemField] = trim($row[$csvField]);
                } else {
                    $contactData['custom_fields'][$systemField] = trim($row[$csvField]);
                }
            }
        }

        return $contactData;
    }

    protected function validateContact(array $contactData): bool
    {
        if (empty($contactData['phone_number'])) {
            return false;
        }

        // Basic phone number validation
        $phone = preg_replace('/[^0-9+]/', '', $contactData['phone_number']);
        return strlen($phone) >= 10;
    }

    protected function saveContacts(Campaign $campaign, array $contacts): void
    {
        $contactModels = [];

        foreach ($contacts as $contact) {
            $contactModels[] = [
                'campaign_id' => $campaign->id,
                'first_name' => $contact['first_name'],
                'last_name' => $contact['last_name'],
                'phone_number' => $contact['phone_number'],
                'email' => $contact['email'],
                'custom_fields' => $contact['custom_fields'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        CampaignContact::insert($contactModels);
    }

    public function scheduleCampaign(Campaign $campaign, string $scheduledAt, string $timezone): void
    {
        $scheduledTime = Carbon::parse($scheduledAt, $timezone)->utc();

        $campaign->update([
            'scheduled_at' => $scheduledTime,
            'timezone' => $timezone,
            'status' => 'scheduled'
        ]);

        // Dispatch job to start campaign at scheduled time
        SendCampaignMessage::dispatch($campaign)->delay($scheduledTime);
    }

    public function startCampaign(Campaign $campaign): void
    {
        $campaign->update([
            'status' => 'running',
            'started_at' => now()
        ]);

        // Process contacts in batches to avoid memory issues
        $campaign->contacts()
            ->where('status', 'pending')
            ->chunk(100, function ($contacts) use ($campaign) {
                foreach ($contacts as $contact) {
                    SendCampaignMessage::dispatch($campaign, $contact);
                }
            });
    }

    public function sendMessageToContact(Campaign $campaign, CampaignContact $contact): bool
    {
        try {
            $message = $this->replaceVariables($campaign->message_template, $contact);

            $this->twilioService->sendMessage($contact->phone_number, $message);

            $contact->update([
                'status' => 'sent',
                'sent_at' => now()
            ]);

            $campaign->increment('sent_count');

            return true;
        } catch (\Exception $e) {
            $contact->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            $campaign->increment('failed_count');

            return false;
        }
    }

    public function recordReplyForNumber(string $phoneNumber): void
    {
        $contact = CampaignContact::where('phone_number', $phoneNumber)->first();

        if (! $contact || $contact->replied_at) {
            return;
        }

        $contact->update([
            'replied_at' => now(),
        ]);

        $contact->campaign()->increment('replied_count');
    }

    protected function replaceVariables(string $template, CampaignContact $contact): string
    {
        $variables = [
            '{{first_name}}' => $contact->first_name ?? '',
            '{{last_name}}' => $contact->last_name ?? '',
            '{{full_name}}' => $contact->full_name,
            '{{phone_number}}' => $contact->phone_number,
            '{{email}}' => $contact->email ?? '',
        ];

        // Add custom fields
        if ($contact->custom_fields) {
            foreach ($contact->custom_fields as $key => $value) {
                $variables["{{$key}}"] = $value;
            }
        }

        return str_replace(array_keys($variables), array_values($variables), $template);
    }

    public function getCampaignStats(Campaign $campaign): array
    {
        $pending = max(0, $campaign->total_contacts - $campaign->sent_count - $campaign->failed_count);
        $sentRate = $campaign->total_contacts > 0 ? round(($campaign->sent_count / $campaign->total_contacts) * 100, 1) : 0;
        $scheduledRate = $campaign->total_contacts > 0 ? round(($pending / $campaign->total_contacts) * 100, 1) : 0;
        $replyRate = $campaign->total_contacts > 0 ? round(($campaign->replied_count / $campaign->total_contacts) * 100, 1) : 0;

        return [
            'total' => $campaign->total_contacts,
            'sent' => $campaign->sent_count,
            'failed' => $campaign->failed_count,
            'replied' => $campaign->replied_count,
            'pending' => $pending,
            'progress' => $campaign->progress_percentage,
            'rates' => [
                'sent' => $sentRate,
                'scheduled' => $scheduledRate,
                'replied' => $replyRate,
            ],
        ];
    }
}
