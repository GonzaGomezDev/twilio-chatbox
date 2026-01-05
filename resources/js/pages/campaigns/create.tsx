import api from '@/lib/api';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/contexts/toast-context';

interface CsvHeader {
    name: string;
    mapped: boolean;
}

interface FieldMapping {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    email?: string;
    [key: string]: string | undefined;
}

interface Variable {
    code: string;
    description: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Campaigns', href: '/campaigns' },
    { title: 'Create Campaign', href: '/campaigns/create' },
];

const steps = [
    { id: 1, title: 'Campaign Details', description: 'Set up your campaign basics' },
    { id: 2, title: 'Upload Contacts', description: 'Upload and map your CSV file' },
    { id: 3, title: 'Message Template', description: 'Create your message with variables' },
    { id: 4, title: 'Schedule & Send', description: 'Set timing and launch your campaign' },
];

const systemFields = [
    { key: 'first_name', label: 'First Name', required: false },
    { key: 'last_name', label: 'Last Name', required: false },
    { key: 'phone_number', label: 'Phone Number', required: true },
    { key: 'email', label: 'Email', required: false },
];

export default function CreateCampaign() {
    const { success, error: showError } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [campaign, setCampaign] = useState({
        name: '',
        message_template: '',
    });
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
    const [scheduledAt, setScheduledAt] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [timezones, setTimezones] = useState<string[]>([]);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [justCreated, setJustCreated] = useState(false);
    const [redirectAfterCreate, setRedirectAfterCreate] = useState(false);

    useEffect(() => {
        // Load timezones and variables
        api.get('/api/campaigns/timezones').then((r) => setTimezones(r.data.timezones));
        api.get('/api/campaigns/available-variables').then((r) => {
            const vars = Object.entries(r.data.variables).map(([code, description]) => ({
                code,
                description: description as string,
            }));
            setVariables(vars);
        });
    }, []);

    const handleCsvUpload = async (file: File) => {
        setCsvFile(file);
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('csv_file', file);

        try {
            const response = await api.post('/api/campaigns/csv-headers', formData);
            setCsvHeaders(response.data.headers);
            success('CSV uploaded successfully', 'Your file has been processed and headers are ready for mapping.');
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to process CSV file';
            setError(errorMessage);
            showError('CSV Upload Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldMapping = (systemField: string, csvField: string) => {
        setFieldMapping(prev => ({
            ...prev,
            [systemField]: csvField,
        }));
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            if (!campaign.name.trim()) {
                setError('Campaign name is required');
                showError('Validation Error', 'Campaign name is required');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!csvFile) {
                setError('Please upload a CSV file');
                showError('Validation Error', 'Please upload a CSV file');
                return;
            }
            if (!fieldMapping.phone_number) {
                setError('Phone number field mapping is required');
                showError('Validation Error', 'Phone number field mapping is required');
                return;
            }
            setCurrentStep(3);
        } else if (currentStep === 3) {
            if (!campaign.message_template.trim()) {
                setError('Message template is required');
                showError('Validation Error', 'Message template is required');
                return;
            }
            setCurrentStep(4);
        } else if (currentStep === 4) {
            await createCampaign();
        }
        setError('');
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError('');
        }
    };

    const createCampaign = async () => {
        setLoading(true);
        setError('');

        try {
            // Step 1: Create campaign
            const campaignResponse = await api.post('/api/campaigns', {
                name: campaign.name,
                message_template: campaign.message_template,
            });

            const createdCampaign = campaignResponse.data;

            // Step 2: Upload contacts
            const formData = new FormData();
            formData.append('csv_file', csvFile!);
            formData.append('field_mapping', JSON.stringify(fieldMapping));

            const uploadResponse = await api.post(`/api/campaigns/${createdCampaign.id}/upload-contacts`, formData);

            // Show upload results
            if (uploadResponse.data.success > 0) {
                success('Contacts uploaded successfully', `${uploadResponse.data.success} contacts were successfully imported.`);
            }

            if (uploadResponse.data.errors && uploadResponse.data.errors.length > 0) {
                showError('Upload Warnings', `${uploadResponse.data.errors.length} rows had issues during import.`);
            }

            // Step 3: Schedule or start campaign
            if (scheduledAt) {
                await api.post(`/api/campaigns/${createdCampaign.id}/schedule`, {
                    scheduled_at: scheduledAt,
                    timezone,
                });
                success('Campaign scheduled successfully', `Your campaign "${campaign.name}" has been scheduled for ${new Date(scheduledAt).toLocaleString()}`);
            } else {
                await api.post(`/api/campaigns/${createdCampaign.id}/start`);
                success('Campaign started successfully', `Your campaign "${campaign.name}" has been started and is now sending messages.`);
            }

            // Handle post-creation behavior
            if (redirectAfterCreate) {
                success('Campaign created successfully!', 'Redirecting to campaigns list...');
                router.visit('/campaigns');
            } else {
                // Reset form and go back to step 1
                resetForm();
                setJustCreated(true);
                success('Campaign created successfully!', 'You can now create another campaign or view your campaigns list.');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to create campaign';
            setError(errorMessage);
            showError('Campaign Creation Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCampaign({
            name: '',
            message_template: '',
        });
        setCsvFile(null);
        setCsvHeaders([]);
        setFieldMapping({});
        setScheduledAt('');
        setTimezone('UTC');
        setCurrentStep(1);
        setError('');
        setJustCreated(false);
        setRedirectAfterCreate(false);
    };

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('message-template') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = campaign.message_template;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = before + variable + after;
            setCampaign(prev => ({ ...prev, message_template: newText }));

            // Set cursor position after the inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Campaign" />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">Create Campaign</h1>
                        <p className="text-muted-foreground">Set up your SMS campaign step by step</p>
                    </div>
                    <div className="flex space-x-2">
                        {justCreated && (
                            <Button
                                onClick={() => setJustCreated(false)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Create Another Campaign
                            </Button>
                        )}
                        <Link href="/campaigns">
                            <Button variant="outline">
                                View All Campaigns
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center space-x-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                currentStep >= step.id
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-gray-300'
                            }`}>
                                {currentStep > step.id ? '✓' : step.id}
                            </div>
                            <div className="ml-3">
                                <div className="text-sm font-medium">{step.title}</div>
                                <div className="text-xs text-muted-foreground">{step.description}</div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-16 h-0.5 ml-4 ${
                                    currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {justCreated && (
                    <Alert variant="default" className="border-green-200 bg-green-50 text-green-900">
                        <AlertDescription>
                            Campaign created successfully! You can now create another campaign or view your campaigns list.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                        <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Campaign Details */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="campaign-name">Campaign Name</Label>
                                    <Input
                                        id="campaign-name"
                                        value={campaign.name}
                                        onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter campaign name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Upload Contacts */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <Label>Upload CSV File</Label>
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                                    />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Upload a CSV file with your contacts. The first row should contain headers.
                                    </p>
                                </div>

                                {csvHeaders.length > 0 && (
                                    <div className="space-y-4">
                                        <Label>Map CSV Fields</Label>
                                        <div className="space-y-3">
                                            {systemFields.map((field) => (
                                                <div key={field.key} className="flex items-center space-x-4">
                                                    <div className="w-32">
                                                        <Label className="text-sm">
                                                            {field.label}
                                                            {field.required && <span className="text-red-500">*</span>}
                                                        </Label>
                                                    </div>
                                                    <Select
                                                        value={fieldMapping[field.key] || ''}
                                                        onValueChange={(value) => handleFieldMapping(field.key, value)}
                                                    >
                                                        <SelectTrigger className="w-64">
                                                            <SelectValue placeholder="Select CSV column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {csvHeaders.map((header) => (
                                                                <SelectItem key={header} value={header}>
                                                                    {header}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Message Template */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="message-template">Message Template</Label>
                                    <Textarea
                                        id="message-template"
                                        value={campaign.message_template}
                                        onChange={(e) => setCampaign(prev => ({ ...prev, message_template: e.target.value }))}
                                        placeholder="Enter your message template..."
                                        rows={6}
                                    />
                                </div>

                                <div>
                                    <Label>Available Variables</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {variables.map((variable) => (
                                            <Button
                                                key={variable.code}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => insertVariable(variable.code)}
                                            >
                                                {variable.code}
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Click on a variable to insert it into your message template.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Schedule & Send */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Send Immediately or Schedule?</Label>
                                    <div className="space-y-4 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="send-now"
                                                name="send-type"
                                                value="now"
                                                checked={!scheduledAt}
                                                onChange={() => setScheduledAt('')}
                                            />
                                            <Label htmlFor="send-now">Send immediately</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="send-later"
                                                name="send-type"
                                                value="later"
                                                checked={!!scheduledAt}
                                                onChange={() => setScheduledAt(new Date().toISOString().slice(0, 16))}
                                            />
                                            <Label htmlFor="send-later">Schedule for later</Label>
                                        </div>
                                    </div>
                                </div>

                                {scheduledAt && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="scheduled-at">Scheduled Date & Time</Label>
                                            <Input
                                                id="scheduled-at"
                                                type="datetime-local"
                                                value={scheduledAt}
                                                onChange={(e) => setScheduledAt(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select value={timezone} onValueChange={setTimezone}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timezones.map((tz) => (
                                                        <SelectItem key={tz} value={tz}>
                                                            {tz}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Label>After Campaign Creation</Label>
                                    <div className="space-y-2 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="stay-here"
                                                name="redirect-preference"
                                                value="stay"
                                                checked={!redirectAfterCreate}
                                                onChange={() => setRedirectAfterCreate(false)}
                                            />
                                            <Label htmlFor="stay-here">Stay here to create another campaign</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="go-to-list"
                                                name="redirect-preference"
                                                value="redirect"
                                                checked={redirectAfterCreate}
                                                onChange={() => setRedirectAfterCreate(true)}
                                            />
                                            <Label htmlFor="go-to-list">Go to campaigns list</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-6">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={loading}
                            >
                                {currentStep === steps.length ? 'Create Campaign' : 'Next'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

