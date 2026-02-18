import { Button, Card, CardContent, IconPlus } from "@heroui/react";

const Sources = () => {
    return (
        <Card className="w-3/12 h-full">
            <CardContent>
                <div className="flex flex-col">
                    <span className="mb-3 text-muted">
                        Sources
                    </span>
                    <div className="h-0.5 w-full bg-border" />

                    <Button className={"mt-4 w-full"} variant="tertiary">
                        <IconPlus />
                        Add source
                    </Button>
                    <div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default Sources