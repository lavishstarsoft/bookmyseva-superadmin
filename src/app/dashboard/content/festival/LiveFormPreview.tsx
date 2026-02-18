import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LiveFormPreview() {
    const { control } = useFormContext();
    const formFields = useWatch({
        control,
        name: "formFields",
        defaultValue: []
    });

    if (!formFields || formFields.length === 0) {
        return (
            <Card className="h-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground p-6">
                    <p className="text-center">No fields added yet.</p>
                    <p className="text-sm text-center">Add fields on the left to see preview here.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-[#8D0303]/20 shadow-lg sticky top-6">
            <CardHeader className="bg-[#8D0303]/5 rounded-t-xl pb-4">
                <CardTitle className="text-[#8D0303] text-lg">Live Preview</CardTitle>
                <CardDescription>This is how the user will see the form.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-4">
                    {formFields.map((field: any, index: number) => {
                        const colSpan = field.width === 'half' ? 'col-span-6' : field.width === 'third' ? 'col-span-4' : 'col-span-12';

                        if (!field.type) return null;

                        return (
                            <div key={field.id || index} className={cn(colSpan, "space-y-1")}>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">{field.label || "Untitled Field"}</Label>
                                    {!field.required && <span className="text-[10px] text-muted-foreground">(Optional)</span>}
                                </div>

                                {field.type === 'textarea' ? (
                                    <Textarea placeholder={field.placeholder} disabled className="resize-none" />
                                ) : field.type === 'select' ? (
                                    <Select disabled>
                                        <SelectTrigger>
                                            <SelectValue placeholder={field.placeholder || "Select option"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.split(',')
                                                .map((opt: string) => opt.trim())
                                                .filter((opt: string) => opt !== "")
                                                .map((opt: string) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                ) : field.type === 'radio' ? (
                                    <RadioGroup disabled defaultValue={field.options?.split(',')[0]} className="flex gap-4">
                                        {(field.options || "").split(',').map((opt: string) => {
                                            if (!opt) return null;
                                            return (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={opt} />
                                                    <Label htmlFor={opt}>{opt}</Label>
                                                </div>
                                            )
                                        })}
                                    </RadioGroup>
                                ) : field.type === 'checkbox' ? (
                                    <div className="flex items-center space-x-2 pt-1">
                                        <Checkbox disabled />
                                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {field.placeholder || "Yes"}
                                        </label>
                                    </div>
                                ) : (
                                    <Input placeholder={field.placeholder} disabled type={field.type} />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6">
                    <button disabled className="w-full bg-[#8D0303] text-white font-semibold py-2 rounded-lg opacity-50 cursor-not-allowed">
                        Confirm Booking
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
