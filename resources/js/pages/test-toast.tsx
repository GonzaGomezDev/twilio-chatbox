import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/contexts/toast-context';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Test Toast', href: '/test-toast' },
];

export default function TestToast() {
    const { success, error, info } = useToast();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Test Toast Notifications" />
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Toast Notification Test</h1>
                    <p className="text-muted-foreground">Test the toast notification system</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Toast Notifications</CardTitle>
                        <CardDescription>
                            Click the buttons below to test different types of toast notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={() => success('Success!', 'This is a success message with a description.')}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Show Success Toast
                            </Button>

                            <Button
                                onClick={() => error('Error!', 'This is an error message with a description.')}
                                variant="destructive"
                            >
                                Show Error Toast
                            </Button>

                            <Button
                                onClick={() => info('Info!', 'This is an info message with a description.')}
                                variant="outline"
                            >
                                Show Info Toast
                            </Button>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium mb-2">Campaign-specific toasts:</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={() => success('Campaign Created!', 'Your campaign "Test Campaign" has been created successfully.')}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Campaign Created
                                </Button>

                                <Button
                                    onClick={() => success('Contacts Uploaded!', '150 contacts were successfully imported.')}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Contacts Uploaded
                                </Button>

                                <Button
                                    onClick={() => success('Campaign Started!', 'Your campaign is now running and sending messages.')}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Campaign Started
                                </Button>

                                <Button
                                    onClick={() => error('Upload Failed!', 'Failed to process CSV file. Please check the format.')}
                                    size="sm"
                                    variant="destructive"
                                >
                                    Upload Failed
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
