import React from "react";
import { type WidgetTheme } from "@quickstart-ai/widget-core";
export interface ChatBotProps {
    clientId: string;
    apiUrl?: string;
    theme?: WidgetTheme;
    position?: "left" | "right";
    primaryColor?: string;
    /** @deprecated use clientId */
    token?: string;
}
export declare function ChatBot({ clientId, apiUrl, theme, position, primaryColor: primaryColorProp, token, }: ChatBotProps): React.JSX.Element | null;
export default ChatBot;
//# sourceMappingURL=index.d.ts.map