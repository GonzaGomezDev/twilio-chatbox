import api from '@/lib/api';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/toast-context';

interface CampaignContact {
    id: number;
    first_name: string | null;
    last_name: string | null;
    phone_number: string;
    email: string | null;
    status: 'pending' | 'sent' | 'failed';
    sent_at: string | null;
    error_message: string | null;
    replied_at?: string | null;
    custom_fields: Record<string, any>;
}

interface Campaign {
    id: number;
    name: string;
    message_template: string;
    status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
    total_contacts: number;
    sent_count: number;
    failed_count: number;
    replied_count: number;
    scheduled_at: string | null;
    timezone: string;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    contacts: CampaignContact[];
}

interface Stats {
    total: number;
    sent: number;
    failed: number;
    replied: number;
    pending: number;
    progress: number;
    rates: {
        sent: number;
        scheduled: number;
        replied: number;
    };
}

interface Props {
    campaign?: Campaign;
    stats?: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Campaigns', href: '/campaigns' },
    { title: 'Campaign Details', href: '#' },
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

const contactStatusColors = {
    pending: 'bg-gray-100 text-gray-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    replied: 'bg-blue-100 text-blue-800',
};

const contactStatusLabels = {
    pending: 'Pending',
    sent: 'Sent',
    failed: 'Failed',
    replied: 'Replied',
};

const mockContacts: CampaignContact[] = [
    {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        phone_number: '+15551234567',
        email: 'jane@example.com',
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: null,
        replied_at: new Date().toISOString(),
        custom_fields: { city: 'Austin' },
    },
    {
        id: 2,
        first_name: 'Mike',
        last_name: 'Smith',
        phone_number: '+15557654321',
        email: 'mike@example.com',
        status: 'pending',
        sent_at: null,
        error_message: null,
        replied_at: null,
        custom_fields: { city: 'Denver' },
    },
    {
        id: 3,
        first_name: 'Priya',
        last_name: 'Patel',
        phone_number: '+15559871234',
        email: 'priya@example.com',
        status: 'failed',
        sent_at: null,
        error_message: 'Carrier rejected',
        replied_at: null,
        custom_fields: { city: 'Seattle' },
    },
];

const mockCampaign: Campaign = {
    id: 0,
    name: 'Spring Launch Mock',
    message_template: 'Hi {{first_name}}, running text campaigns can be effective and engaging, however, they require careful planning and execution to achieve the best results. Up for a chat?',
    status: 'running',
    total_contacts: 1300,
    sent_count: 996,
    failed_count: 50,
    replied_count: 214,
    scheduled_at: null,
    timezone: 'UTC',
    started_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    contacts: mockContacts,
};

const deriveStats = (campaign: Campaign): Stats => {
    const pending = Math.max(0, campaign.total_contacts - campaign.sent_count - campaign.failed_count);
    const base = campaign.total_contacts || 1;
    const sentRate = Math.round((campaign.sent_count / base) * 1000) / 10;
    const scheduledRate = Math.round((pending / base) * 1000) / 10;
    const replyRate = Math.round((campaign.replied_count / base) * 1000) / 10;

    return {
        total: campaign.total_contacts,
        sent: campaign.sent_count,
        failed: campaign.failed_count,
        replied: campaign.replied_count,
        pending,
        progress: Math.min(100, Math.round((campaign.sent_count + campaign.failed_count) / base * 100)),
        rates: {
            sent: sentRate,
            scheduled: scheduledRate,
            replied: replyRate,
        },
    };
};

export default function CampaignShow({ campaign: initialCampaign, stats: initialStats }: Props) {
    const { success, error: showError } = useToast();
    const hydratedCampaign = initialCampaign ?? mockCampaign;
    const hydratedStats = initialStats ?? deriveStats(hydratedCampaign);

    const [campaign, setCampaign] = useState(hydratedCampaign);
    const [stats, setStats] = useState<Stats>(hydratedStats);
    const [loading, setLoading] = useState(false);
    const [editName, setEditName] = useState(hydratedCampaign.name);
    const [editTemplate, setEditTemplate] = useState(hydratedCampaign.message_template);

    const getProgressPercentage = () => stats.progress;

    const handleStartCampaign = async () => {
        setLoading(true);
        try {
            await api.post(`/api/campaigns/${campaign.id}/start`);
            await refreshCampaign();
            success('Campaign started successfully', 'Your campaign is now running and sending messages to contacts.');
        } catch (error: any) {
            console.error('Failed to start campaign:', error);
            showError('Failed to start campaign', error.response?.data?.error || 'An error occurred while starting the campaign.');
        } finally {
            setLoading(false);
        }
    };

    const refreshCampaign = async () => {
        const response = await api.get(`/api/campaigns/${campaign.id}`);
        const refreshedCampaign: Campaign = response.data.campaign;
        const refreshedStats: Stats = response.data.stats ?? deriveStats(refreshedCampaign);
        setCampaign(refreshedCampaign);
        setStats(refreshedStats);
        setEditName(refreshedCampaign.name);
        setEditTemplate(refreshedCampaign.message_template);
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put(`/api/campaigns/${campaign.id}`, {
                name: editName,
                message_template: editTemplate,
            });
            await refreshCampaign();
            success('Campaign updated', 'Campaign details were saved successfully.');
        } catch (error: any) {
            showError('Update failed', error.response?.data?.message || 'Could not update campaign.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this campaign? This cannot be undone.')) return;

        setLoading(true);
        try {
            await api.delete(`/api/campaigns/${campaign.id}`);
            success('Campaign deleted', 'The campaign was removed.');
            router.visit('/campaigns');
        } catch (error: any) {
            showError('Delete failed', error.response?.data?.message || 'Could not delete campaign.');
        } finally {
            setLoading(false);
        }
    };

    const getContactStatusCount = (status: string) => {
        return campaign.contacts.filter(contact => contact.status === status).length;
    };

    const pendingContacts = stats.pending;
    const sentContacts = stats.sent;
    const failedContacts = stats.failed;
    const repliedContacts = stats.replied;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-3">
                <Head title={`Campaign: ${campaign.name}`} />
            </div>
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{campaign.name}</h1>
                        <p className="text-muted-foreground">Campaign Details</p>
                    </div>
                    <div className="flex space-x-2">
                        <Link href="/campaigns">
                            <Button variant="outline">Back to Campaigns</Button>
                        </Link>
                        {campaign.status === 'draft' && (
                            <Button onClick={handleStartCampaign} disabled={loading}>
                                {loading ? 'Starting...' : 'Start Campaign'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <Badge className={statusColors[campaign.status]}>
                                {statusLabels[campaign.status]}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{campaign.total_contacts}</div>
                            <p className="text-xs text-muted-foreground">Total Contacts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sent Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rates.sent}%</div>
                            <p className="text-xs text-muted-foreground">Sent / Total contacts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rates.scheduled}%</div>
                            <p className="text-xs text-muted-foreground">Pending / Total contacts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.rates.replied}%</div>
                            <p className="text-xs text-muted-foreground">Contacts that replied</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Message Template</Label>
                                <div className="mt-1 p-3 rounded-md text-sm">
                                    {campaign.message_template}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Created</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(campaign.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {campaign.scheduled_at && (
                                    <div>
                                        <Label className="text-sm font-medium">Scheduled</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(campaign.scheduled_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {campaign.started_at && (
                                    <div>
                                        <Label className="text-sm font-medium">Started</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(campaign.started_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {campaign.completed_at && (
                                    <div>
                                        <Label className="text-sm font-medium">Completed</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(campaign.completed_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Progress Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Overall Progress</span>
                                        <span>{getProgressPercentage()}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-400 h-2 rounded-full transition-all"
                                            style={{ width: `${getProgressPercentage()}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Pending</span>
                                        <span className="text-gray-600">{pendingContacts}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Sent</span>
                                        <span className="text-green-600">{sentContacts}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Failed</span>
                                        <span className="text-red-600">{failedContacts}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Replied</span>
                                        <span className="text-white">{repliedContacts}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Contacts</CardTitle>
                        <CardDescription>
                            {stats.total} contacts in this campaign
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList>
                                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                                <TabsTrigger value="pending">Pending ({pendingContacts})</TabsTrigger>
                                <TabsTrigger value="sent">Sent ({sentContacts})</TabsTrigger>
                                <TabsTrigger value="failed">Failed ({failedContacts})</TabsTrigger>
                                <TabsTrigger value="replied">Replied ({repliedContacts})</TabsTrigger>
                            </TabsList>

                            {['all', 'pending', 'sent', 'failed', 'replied'].map((tab) => (
                                <TabsContent key={tab} value={tab} className="mt-4">
                                    <div className="space-y-2">
                                        {campaign.contacts
                                            .filter(contact => {
                                                if (tab === 'all') return true;
                                                if (tab === 'replied') return !!contact.replied_at;
                                                return contact.status === tab;
                                            })
                                            .map((contact) => (
                                                <div
                                                    key={contact.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="font-medium">
                                                                {contact.first_name && contact.last_name
                                                                    ? `${contact.first_name} ${contact.last_name}`
                                                                    : contact.phone_number}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {contact.phone_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge className={contact.replied_at ? contactStatusColors.replied : contactStatusColors[contact.status]}>
                                                            {contact.replied_at ? contactStatusLabels.replied : contactStatusLabels[contact.status]}
                                                        </Badge>
                                                        {contact.sent_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(contact.sent_at).toLocaleString()}
                                                            </span>
                                                        )}
                                                        {contact.replied_at && (
                                                            <span className="text-xs text-white">
                                                                Replied {new Date(contact.replied_at).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Campaign</CardTitle>
                        <CardDescription>Update basics or remove the campaign.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium" htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Campaign name"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium" htmlFor="edit-template">Message Template</Label>
                                <Textarea
                                    id="edit-template"
                                    value={editTemplate}
                                    onChange={(e) => setEditTemplate(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleUpdate} disabled={loading}>Save changes</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={loading}>Delete campaign</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
