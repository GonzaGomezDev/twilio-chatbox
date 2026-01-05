import api from '@/lib/api';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/toast-context';

interface Campaign {
    id: number;
    name: string;
    status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
    total_contacts: number;
    sent_count: number;
    failed_count: number;
    replied_count: number;
    scheduled_at?: string;
    created_at: string;
}

interface Props {
    campaigns: Campaign[];
}

interface DashboardStats {
    totals: {
        campaigns: number;
        scheduled: number;
        running: number;
        completed: number;
    };
    rates: {
        sent: number;
        scheduled: number;
        replied: number;
    };
    contacts_total: number;
    sent_total: number;
    replied_total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Campaigns', href: '/campaigns' },
];

const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    running: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const statusLabels = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
};

export default function CampaignsIndex({ campaigns: initialCampaigns }: Props) {
    const { success, error: showError } = useToast();
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [dashboard, setDashboard] = useState<DashboardStats | null>(null);

    useEffect(() => {
        api.get('/api/campaigns/dashboard')
            .then((r) => setDashboard(r.data))
            .catch(() => showError('Failed to load dashboard', 'Could not load campaign summary'));
    }, []);

    const getProgressPercentage = (campaign: Campaign) => {
        if (campaign.total_contacts === 0) return 0;
        return Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_contacts) * 100);
    };

    const deleteCampaign = (id: number) => {
        if (!confirm('Delete this campaign?')) return;

        api.delete(`/api/campaigns/${id}`)
            .then(() => {
                setCampaigns((prev) => prev.filter((c) => c.id !== id));
                success('Campaign deleted', 'The campaign has been removed.');
                api.get('/api/campaigns/dashboard').then((r) => setDashboard(r.data));
            })
            .catch((error) => {
                showError('Failed to delete', error.response?.data?.error || 'An error occurred');
            });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-3">
                <Head title="Campaigns" />
            </div>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Campaigns</h1>
                        <p className="text-muted-foreground">Manage your SMS campaigns</p>
                    </div>
                    <Link href="/campaigns/create">
                        <Button>Create Campaign</Button>
                    </Link>
                </div>

                {dashboard && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Sent Rate</CardTitle>
                                <CardDescription>Sent / total contacts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">{dashboard.rates.sent}%</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Scheduled Rate</CardTitle>
                                <CardDescription>Scheduled campaigns / total</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">{dashboard.rates.scheduled}%</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Reply Rate</CardTitle>
                                <CardDescription>Contacts that replied</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">{dashboard.rates.replied}%</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {campaigns.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="text-center space-y-4">
                                <div className="text-6xl">📧</div>
                                <h3 className="text-xl font-semibold">No campaigns yet</h3>
                                <p className="text-muted-foreground">
                                    Create your first campaign to start sending messages to your contacts.
                                </p>
                                <Link href="/campaigns/create">
                                    <Button>Create Your First Campaign</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map((campaign) => (
                            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                            <CardDescription>
                                                Created {new Date(campaign.created_at).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <Badge className={statusColors[campaign.status]}>
                                            {statusLabels[campaign.status]}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress</span>
                                            <span>{getProgressPercentage(campaign)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${getProgressPercentage(campaign)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-semibold">{campaign.total_contacts}</div>
                                            <div className="text-muted-foreground">Total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-green-600">{campaign.sent_count}</div>
                                            <div className="text-muted-foreground">Sent</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-red-600">{campaign.failed_count}</div>
                                            <div className="text-muted-foreground">Failed</div>
                                        </div>
                                    </div>

                                    {campaign.scheduled_at && (
                                        <div className="text-sm text-muted-foreground">
                                            Scheduled for {new Date(campaign.scheduled_at).toLocaleString()}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                View Details
                                            </Button>
                                        </Link>
                                        <Button variant="destructive" onClick={() => deleteCampaign(campaign.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
