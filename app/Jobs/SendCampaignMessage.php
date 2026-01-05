<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\CampaignContact;
use App\Services\CampaignService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendCampaignMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;

    protected $campaign;
    protected $contact;

    public function __construct(Campaign $campaign, CampaignContact $contact = null)
    {
        $this->campaign = $campaign;
        $this->contact = $contact;
    }

    public function handle(CampaignService $campaignService): void
    {
        if ($this->contact) {
            // Send message to specific contact
            $campaignService->sendMessageToContact($this->campaign, $this->contact);
        } else {
            // Start the entire campaign
            $campaignService->startCampaign($this->campaign);
        }
    }

    public function failed(\Throwable $exception): void
    {
        // Log the failure
        \Illuminate\Support\Facades\Log::error('Campaign message failed', [
            'campaign_id' => $this->campaign->id,
            'contact_id' => $this->contact?->id,
            'error' => $exception->getMessage()
        ]);

        if ($this->contact) {
            $this->contact->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage()
            ]);
        }
    }
}
