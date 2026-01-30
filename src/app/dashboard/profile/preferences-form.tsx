"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function PreferencesForm() {
    return (
        <Card className="border shadow-md bg-card">
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                    Configure how you receive notifications.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="functional" className="flex flex-col space-y-1">
                        <span>Functional Cookies</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            These cookies allow the website to provide personalized functionality.
                        </span>
                    </Label>
                    <Switch id="functional" className="data-[state=checked]:bg-[#8D0303] data-[state=unchecked]:bg-gray-200 border-2 border-[#8D0303] shadow-inner" />

                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="marketing" className="flex flex-col space-y-1">
                        <span>Marketing Messages</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Receive updates about new products and features.
                        </span>
                    </Label>
                    <Switch id="marketing" className="data-[state=checked]:bg-[#8D0303] data-[state=unchecked]:bg-gray-200 border-2 border-[#8D0303] shadow-inner" />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="security_emails" className="flex flex-col space-y-1">
                        <span>Security Emails</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Receive emails about your account security.
                        </span>
                    </Label>
                    <Switch id="security_emails" defaultChecked className="data-[state=checked]:bg-[#8D0303] data-[state=unchecked]:bg-gray-200 border-2 border-[#8D0303] shadow-inner" />
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full">
                    Save preferences
                </Button>
            </CardFooter>
        </Card>
    )
}
