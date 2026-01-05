<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CampaignController extends Controller
{
    protected $campaignService;

    public function __construct(CampaignService $campaignService)
    {
        $this->campaignService = $campaignService;
    }

    public function index(Request $request): JsonResponse
    {
        $campaigns = Campaign::where('user_id', $request->user()->id)
            ->withCount(['contacts as total_contacts'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($campaigns);
    }

    public function show(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        $campaign->load('contacts');
        $stats = $this->campaignService->getCampaignStats($campaign);

        return response()->json([
            'campaign' => $campaign,
            'stats' => $stats
        ]);
    }

    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'message_template' => 'sometimes|required|string',
        ]);

        $campaign->update($validated);

        return response()->json($campaign->fresh());
    }

    public function destroy(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted']);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $campaigns = Campaign::where('user_id', $request->user()->id)->get();

        $totals = [
            'campaigns' => $campaigns->count(),
            'scheduled' => $campaigns->where('status', 'scheduled')->count(),
            'running' => $campaigns->where('status', 'running')->count(),
            'completed' => $campaigns->where('status', 'completed')->count(),
        ];

        $contactsTotal = (int) $campaigns->sum('total_contacts');
        $sentTotal = (int) $campaigns->sum('sent_count');
        $repliedTotal = (int) $campaigns->sum('replied_count');

        $sentRate = $contactsTotal > 0 ? round(($sentTotal / $contactsTotal) * 100, 1) : 0;
        $replyRate = $contactsTotal > 0 ? round(($repliedTotal / $contactsTotal) * 100, 1) : 0;
        $scheduledRate = $totals['campaigns'] > 0 ? round(($totals['scheduled'] / $totals['campaigns']) * 100, 1) : 0;

        return response()->json([
            'totals' => $totals,
            'contacts_total' => $contactsTotal,
            'sent_total' => $sentTotal,
            'replied_total' => $repliedTotal,
            'rates' => [
                'sent' => $sentRate,
                'scheduled' => $scheduledRate,
                'replied' => $replyRate,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message_template' => 'required|string',
        ]);

        $campaign = $this->campaignService->createCampaign([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'message_template' => $validated['message_template'],
        ]);

        return response()->json($campaign, 201);
    }

    public function uploadContacts(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
            'field_mapping' => 'required|array',
            'field_mapping.first_name' => 'nullable|string',
            'field_mapping.last_name' => 'nullable|string',
            'field_mapping.phone_number' => 'required|string',
            'field_mapping.email' => 'nullable|string',
        ]);

        $result = $this->campaignService->processCsvUpload(
            $campaign,
            $request->file('csv_file'),
            $validated['field_mapping']
        );

        return response()->json($result);
    }

    public function schedule(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'scheduled_at' => 'required|date|after:now',
            'timezone' => 'required|string',
        ]);

        $this->campaignService->scheduleCampaign(
            $campaign,
            $validated['scheduled_at'],
            $validated['timezone']
        );

        return response()->json(['message' => 'Campaign scheduled successfully']);
    }

    public function start(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($campaign->user_id === $request->user()->id, 403);

        if ($campaign->status !== 'draft') {
            return response()->json(['error' => 'Campaign can only be started from draft status'], 400);
        }

        $this->campaignService->startCampaign($campaign);

        return response()->json(['message' => 'Campaign started successfully']);
    }

    public function getCsvHeaders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('csv_file');
        $content = file_get_contents($file->getPathname());
        $lines = explode("\n", $content);
        $headers = str_getcsv(array_shift($lines));

        return response()->json(['headers' => $headers]);
    }

    public function getAvailableVariables(): JsonResponse
    {
        $variables = [
            '{{first_name}}' => 'Contact first name',
            '{{last_name}}' => 'Contact last name',
            '{{full_name}}' => 'Contact full name',
            '{{phone_number}}' => 'Contact phone number',
            '{{email}}' => 'Contact email address',
        ];

        return response()->json(['variables' => $variables]);
    }

    public function getTimezones(): JsonResponse
    {
        $timezones = \DateTimeZone::listIdentifiers();

        return response()->json(['timezones' => $timezones]);
    }
}

