<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function __construct(private CampaignService $campaignService)
    {
    }

    public function index(Request $request): Response
    {
        $campaigns = Campaign::where('user_id', $request->user()->id)
            ->withCount(['contacts as total_contacts'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('campaigns/index', [
            'campaigns' => $campaigns
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('campaigns/create');
    }

    public function show(Request $request, Campaign $campaign): Response
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        $campaign->load('contacts');
        $stats = $this->campaignService->getCampaignStats($campaign);

        return Inertia::render('campaigns/show', [
            // 'campaign' => $campaign,
            // 'stats' => $stats,
        ]);
    }
}
