import { Card, CardContent } from "@heroui/react";
import React from "react";
import ReactMarkdown from "react-markdown";

// Custom component to highlight active text within paragraph content
const HighlightedParagraph = (props: React.HTMLAttributes<HTMLParagraphElement>) => {
    const { children, ...rest } = props;
    const text = typeof children === 'string' ? children :
        Array.isArray(children) ? children.join('') : String(children);

    if (text.includes(activeText)) {
        // Split the text and wrap the activeText with highlight class
        const parts = text.split(activeText);
        return (
            <p {...rest}>
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < parts.length - 1 && (
                            <span className="bg-[#c1be79] text-[#45421b] px-1 rounded font-semibold">
                                {activeText}
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </p>
        );
    }

    return <p {...rest}>{children}</p>;
};




const mockContent = `## A One-Page Retelling: The Trial of Hari Seldon

In the glittering heart of Trantor—the planet that is all city, all corridors and chrome—an old mathematician stands beneath lights too bright for mercy. The chamber is vast, tier upon tier of officials robed in authority, their expressions carved from the same stone as the Empire they serve. Above them, the sigil of a million worlds hangs like a silent sun.

Hari Seldon does not look like a revolutionary. His shoulders slope with age; his voice, when he begins, is almost gentle. Yet the numbers he carries are dynamite.

He speaks of psychohistory, a mathematics so immense it swallows crowds and civilizations whole. Not prophecy—never that. Individuals are noise. But populations? Populations are weather systems. Given enough data, enough time, their storms can be charted. The Empire, he explains, is not eternal. Its fall is not a rumor or a political wish. It is a statistical certainty.

A murmur ripples outward—skepticism first, then irritation. The Empire has stood for twelve thousand years. It has laws, fleets, taxes, and pride. Pride most of all.

Seldon continues. The collapse will not be tidy. It will not be brief. Thirty thousand years of darkness will follow—barbarism chewing on the bones of science. Knowledge will gutter out, world by world, until even the memory of galactic unity becomes myth.

Now the chamber is silent.

He offers no rebellion, no army. Instead, he proposes a library at the edge of the galaxy—a Foundation to gather and preserve human knowledge, to compress the coming dark from thirty millennia to one. Not salvation. Mitigation.

The Commission’s questions strike like darts: Is this not treason? Is predicting doom not the same as inviting it? Are you not undermining confidence in the throne?

Seldon answers without heat. Mathematics is indifferent to crowns.

Behind the spectacle, politics coils. Exile is cleaner than execution. A distant world—Terminus—poor in metals, rich only in isolation. Let the mathematician build his encyclopedia there. Let him be far from the capital’s nerves.

Sentence is pronounced with the smooth finality of a sealed hatch.

As the chamber empties, Seldon’s supporters gather close. Fear flickers in their eyes, but so does something brighter: purpose. They will go to the rim. They will build their vault of knowledge against the night.

Outside, Trantor gleams—endless, confident, already decaying in ways too gradual for emperors to notice.

And somewhere in the quiet architecture of equations, the future has begun to narrow into a path.
`;

const activeText = "Hari Seldon does not look like a revolutionary. His shoulders slope with age; his voice, when he begins, is almost gentle. Yet the numbers he carries are dynamite."


const Chat = () => {
    return (
        <Card className="w-8/12 p-0 bg-(--field-background) h-full">
            <CardContent className="h-full">
                <div className="
prose max-w-none
prose-headings:text-foreground
prose-p:text-foreground
prose-strong:text-foreground
prose-li:text-foreground
prose-a:text-primary h-full overflow-y-auto p-4 no-scrollbar-track">
                    <ReactMarkdown
                        components={{
                            p: HighlightedParagraph,
                        }}
                    >
                        {mockContent}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    )
}

export default Chat