import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/contexts/toast-context';
import { Clipboard, RefreshCw, Shield } from 'lucide-react';

interface TwilioKeys {
    account_sid: string;
    auth_token: string;
    messaging_service_sid: string;
    from_number: string;
}

interface Props {
    twilio: TwilioKeys;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'API keys', href: '/api-keys' },
];

export default function ApiKeys({ twilio }: Props) {
    const { success } = useToast();
    const [form, setForm] = useState<TwilioKeys>(twilio);

    const copy = (value: string, label: string) => {
        navigator.clipboard.writeText(value);
        success(`${label} copied`, 'Paste it into your console or config.');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API keys" />

            <div className="space-y-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">API keys</h1>
                        <p className="text-muted-foreground">
                            Connect your Twilio account so we can send and receive SMS on your behalf.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Security guide
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Twilio credentials</CardTitle>
                            <CardDescription>Paste your SID and token from the Twilio Console.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="account_sid">Account SID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="account_sid"
                                        value={form.account_sid}
                                        onChange={(e) => setForm({ ...form, account_sid: e.target.value })}
                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    />
                                    <Button type="button" variant="secondary" onClick={() => copy(form.account_sid, 'Account SID')}>
                                        <Clipboard className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="auth_token">Auth token</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="auth_token"
                                        type="password"
                                        value={form.auth_token}
                                        onChange={(e) => setForm({ ...form, auth_token: e.target.value })}
                                        placeholder="Your auth token"
                                    />
                                    <Button type="button" variant="secondary" onClick={() => copy(form.auth_token, 'Auth token')}>
                                        <Clipboard className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Keep this private. Rotate it if you suspect exposure.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="messaging_service_sid">Messaging Service SID (optional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="messaging_service_sid"
                                        value={form.messaging_service_sid}
                                        onChange={(e) => setForm({ ...form, messaging_service_sid: e.target.value })}
                                        placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    />
                                    <Button type="button" variant="secondary" onClick={() => copy(form.messaging_service_sid, 'Messaging Service SID')}>
                                        <Clipboard className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Recommended for pooled sending and higher deliverability.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="from_number">Default from number</Label>
                                <Input
                                    id="from_number"
                                    value={form.from_number}
                                    onChange={(e) => setForm({ ...form, from_number: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="secondary" className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Rotate token
                            </Button>
                            <Button>Save keys</Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>How to connect Twilio</CardTitle>
                            <CardDescription>Fast setup — no code required.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <ol className="space-y-2 list-decimal list-inside">
                                <li>Open Twilio Console → Account → API keys & tokens.</li>
                                <li>Copy your Account SID and Auth Token into the fields on the left.</li>
                                <li>Optionally copy your Messaging Service SID if you use one.</li>
                                <li>Add a verified sending number (or a messaging service) as your default from number.</li>
                                <li>Click “Save keys”.</li>
                            </ol>
                            <div className="rounded-lg bg-muted/60 p-3">
                                <p className="font-medium text-foreground">Need help?</p>
                                <p>Contact support and we’ll jump on a call to configure your account.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
