import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    category?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    category?: string | undefined;
}>;
export declare const triggerConditionSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"time_on_page">;
    seconds: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "time_on_page";
    seconds: number;
}, {
    type: "time_on_page";
    seconds: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"url_match">;
    pattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "url_match";
    pattern: string;
}, {
    type: "url_match";
    pattern: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"exit_intent">;
}, "strip", z.ZodTypeAny, {
    type: "exit_intent";
}, {
    type: "exit_intent";
}>, z.ZodObject<{
    type: z.ZodLiteral<"scroll_depth">;
    percent: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "scroll_depth";
    percent: number;
}, {
    type: "scroll_depth";
    percent: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"idle">;
    seconds: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "idle";
    seconds: number;
}, {
    type: "idle";
    seconds: number;
}>]>;
export declare const proactiveTriggerRuleSchema: z.ZodObject<{
    id: z.ZodString;
    message: z.ZodString;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** All conditions must hold for the rule to fire ("AND" combinators). */
    conditions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"time_on_page">;
        seconds: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "time_on_page";
        seconds: number;
    }, {
        type: "time_on_page";
        seconds: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"url_match">;
        pattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "url_match";
        pattern: string;
    }, {
        type: "url_match";
        pattern: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"exit_intent">;
    }, "strip", z.ZodTypeAny, {
        type: "exit_intent";
    }, {
        type: "exit_intent";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"scroll_depth">;
        percent: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "scroll_depth";
        percent: number;
    }, {
        type: "scroll_depth";
        percent: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"idle">;
        seconds: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "idle";
        seconds: number;
    }, {
        type: "idle";
        seconds: number;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    id: string;
    enabled: boolean;
    conditions: ({
        type: "time_on_page";
        seconds: number;
    } | {
        type: "url_match";
        pattern: string;
    } | {
        type: "exit_intent";
    } | {
        type: "scroll_depth";
        percent: number;
    } | {
        type: "idle";
        seconds: number;
    })[];
}, {
    message: string;
    id: string;
    conditions: ({
        type: "time_on_page";
        seconds: number;
    } | {
        type: "url_match";
        pattern: string;
    } | {
        type: "exit_intent";
    } | {
        type: "scroll_depth";
        percent: number;
    } | {
        type: "idle";
        seconds: number;
    })[];
    enabled?: boolean | undefined;
}>;
export declare const proactiveTriggersConfigSchema: z.ZodObject<{
    /** Caps total proactive fires per visitor per day, across all rules. */
    maxFiresPerDay: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    rules: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        message: z.ZodString;
        enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        /** All conditions must hold for the rule to fire ("AND" combinators). */
        conditions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"time_on_page">;
            seconds: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "time_on_page";
            seconds: number;
        }, {
            type: "time_on_page";
            seconds: number;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"url_match">;
            pattern: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "url_match";
            pattern: string;
        }, {
            type: "url_match";
            pattern: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"exit_intent">;
        }, "strip", z.ZodTypeAny, {
            type: "exit_intent";
        }, {
            type: "exit_intent";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"scroll_depth">;
            percent: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "scroll_depth";
            percent: number;
        }, {
            type: "scroll_depth";
            percent: number;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"idle">;
            seconds: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "idle";
            seconds: number;
        }, {
            type: "idle";
            seconds: number;
        }>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        message: string;
        id: string;
        enabled: boolean;
        conditions: ({
            type: "time_on_page";
            seconds: number;
        } | {
            type: "url_match";
            pattern: string;
        } | {
            type: "exit_intent";
        } | {
            type: "scroll_depth";
            percent: number;
        } | {
            type: "idle";
            seconds: number;
        })[];
    }, {
        message: string;
        id: string;
        conditions: ({
            type: "time_on_page";
            seconds: number;
        } | {
            type: "url_match";
            pattern: string;
        } | {
            type: "exit_intent";
        } | {
            type: "scroll_depth";
            percent: number;
        } | {
            type: "idle";
            seconds: number;
        })[];
        enabled?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    maxFiresPerDay: number;
    rules: {
        message: string;
        id: string;
        enabled: boolean;
        conditions: ({
            type: "time_on_page";
            seconds: number;
        } | {
            type: "url_match";
            pattern: string;
        } | {
            type: "exit_intent";
        } | {
            type: "scroll_depth";
            percent: number;
        } | {
            type: "idle";
            seconds: number;
        })[];
    }[];
}, {
    rules: {
        message: string;
        id: string;
        conditions: ({
            type: "time_on_page";
            seconds: number;
        } | {
            type: "url_match";
            pattern: string;
        } | {
            type: "exit_intent";
        } | {
            type: "scroll_depth";
            percent: number;
        } | {
            type: "idle";
            seconds: number;
        })[];
        enabled?: boolean | undefined;
    }[];
    maxFiresPerDay?: number | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    allowedOrigins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    widgetTheme: z.ZodOptional<z.ZodEnum<["primary", "secondary", "tech", "professional"]>>;
    widgetPosition: z.ZodOptional<z.ZodEnum<["left", "right"]>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    primaryColor: z.ZodOptional<z.ZodString>;
    welcomeMessage: z.ZodOptional<z.ZodString>;
    toolsWebSearch: z.ZodOptional<z.ZodBoolean>;
    toolsHumanHandoff: z.ZodOptional<z.ZodBoolean>;
    toolsLeadCapture: z.ZodOptional<z.ZodBoolean>;
    allowAnonymousSessions: z.ZodOptional<z.ZodBoolean>;
    proactiveTriggers: z.ZodOptional<z.ZodObject<{
        /** Caps total proactive fires per visitor per day, across all rules. */
        maxFiresPerDay: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        rules: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            message: z.ZodString;
            enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            /** All conditions must hold for the rule to fire ("AND" combinators). */
            conditions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"time_on_page">;
                seconds: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "time_on_page";
                seconds: number;
            }, {
                type: "time_on_page";
                seconds: number;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"url_match">;
                pattern: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "url_match";
                pattern: string;
            }, {
                type: "url_match";
                pattern: string;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"exit_intent">;
            }, "strip", z.ZodTypeAny, {
                type: "exit_intent";
            }, {
                type: "exit_intent";
            }>, z.ZodObject<{
                type: z.ZodLiteral<"scroll_depth">;
                percent: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "scroll_depth";
                percent: number;
            }, {
                type: "scroll_depth";
                percent: number;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"idle">;
                seconds: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "idle";
                seconds: number;
            }, {
                type: "idle";
                seconds: number;
            }>]>, "many">;
        }, "strip", z.ZodTypeAny, {
            message: string;
            id: string;
            enabled: boolean;
            conditions: ({
                type: "time_on_page";
                seconds: number;
            } | {
                type: "url_match";
                pattern: string;
            } | {
                type: "exit_intent";
            } | {
                type: "scroll_depth";
                percent: number;
            } | {
                type: "idle";
                seconds: number;
            })[];
        }, {
            message: string;
            id: string;
            conditions: ({
                type: "time_on_page";
                seconds: number;
            } | {
                type: "url_match";
                pattern: string;
            } | {
                type: "exit_intent";
            } | {
                type: "scroll_depth";
                percent: number;
            } | {
                type: "idle";
                seconds: number;
            })[];
            enabled?: boolean | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        maxFiresPerDay: number;
        rules: {
            message: string;
            id: string;
            enabled: boolean;
            conditions: ({
                type: "time_on_page";
                seconds: number;
            } | {
                type: "url_match";
                pattern: string;
            } | {
                type: "exit_intent";
            } | {
                type: "scroll_depth";
                percent: number;
            } | {
                type: "idle";
                seconds: number;
            })[];
        }[];
    }, {
        rules: {
            message: string;
            id: string;
            conditions: ({
                type: "time_on_page";
                seconds: number;
            } | {
                type: "url_match";
                pattern: string;
            } | {
                type: "exit_intent";
            } | {
                type: "scroll_depth";
                percent: number;
            } | {
                type: "idle";
                seconds: number;
            })[];
            enabled?: boolean | undefined;
        }[];
        maxFiresPerDay?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    allowedOrigins?: string[] | undefined;
    widgetTheme?: "primary" | "secondary" | "tech" | "professional" | undefined;
    widgetPosition?: "left" | "right" | undefined;
    systemPrompt?: string | undefined;
    primaryColor?: string | undefined;
    welcomeMessage?: string | undefined;
    toolsWebSearch?: boolean | undefined;
    toolsHumanHandoff?: boolean | undefined;
    toolsLeadCapture?: boolean | undefined;
    allowAnonymousSessions?: boolean | undefined;
    proactiveTriggers?: {
        maxFiresPerDay: number;
        rules: {
            message: string;
            id: string;
            enabled: boolean;
            conditions: ({
                type: "time_on_page";
                seconds: number;
            } | {
                type: "url_match";
                pattern: string;
            } | {
                type: "exit_intent";
            } | {
                type: "scroll_depth";
                percent: number;
            } | {
                type: "idle";
                seconds: number;
            })[];
        }[];
    } | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    allowedOrigins?: string[] | undefined;
    widgetTheme?: "primary" | "secondary" | "tech" | "professional" | undefined;
    widgetPosition?: "left" | "right" | undefined;
    systemPrompt?: string | undefined;
    primaryColor?: string | undefined;
    welcomeMessage?: string | undefined;
    toolsWebSearch?: boolean | undefined;
    toolsHumanHandoff?: boolean | undefined;
    toolsLeadCapture?: boolean | undefined;
    allowAnonymousSessions?: boolean | undefined;
    proactiveTriggers?: {
        rules: {
            message: string;
            id: string;
            conditions: ({
                type: "time_on_page";
                seconds: number;
            } | {
                type: "url_match";
                pattern: string;
            } | {
                type: "exit_intent";
            } | {
                type: "scroll_depth";
                percent: number;
            } | {
                type: "idle";
                seconds: number;
            })[];
            enabled?: boolean | undefined;
        }[];
        maxFiresPerDay?: number | undefined;
    } | undefined;
}>;
export declare const updateLlmSettingsSchema: z.ZodObject<{
    llmProvider: z.ZodEnum<["platform", "openrouter", "openai", "google", "anthropic", "xai", "groq"]>;
    useOwnLlmKey: z.ZodBoolean;
    /** Preset model id from provider catalog */
    llmModel: z.ZodOptional<z.ZodString>;
    /** New key — omitted keeps existing; empty string clears stored key */
    llmApiKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    llmProvider: "platform" | "openrouter" | "openai" | "google" | "anthropic" | "xai" | "groq";
    useOwnLlmKey: boolean;
    llmModel?: string | undefined;
    llmApiKey?: string | undefined;
}, {
    llmProvider: "platform" | "openrouter" | "openai" | "google" | "anthropic" | "xai" | "groq";
    useOwnLlmKey: boolean;
    llmModel?: string | undefined;
    llmApiKey?: string | undefined;
}>;
export declare const updateKnowledgeDocSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    content?: string | undefined;
}, {
    title?: string | undefined;
    content?: string | undefined;
}>;
export declare const updateKnowledgeQaSchema: z.ZodObject<{
    qaIndex: z.ZodNumber;
    question: z.ZodString;
    answer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    qaIndex: number;
    question: string;
    answer: string;
}, {
    qaIndex: number;
    question: string;
    answer: string;
}>;
export declare const deleteKnowledgeQaSchema: z.ZodObject<{
    qaIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    qaIndex: number;
}, {
    qaIndex: number;
}>;
export declare const onboardingBusinessSchema: z.ZodObject<{
    businessName: z.ZodString;
    businessWebsite: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, z.ZodOptional<z.ZodString>>;
    businessIndustry: z.ZodString;
    businessDescription: z.ZodString;
    businessLocation: z.ZodOptional<z.ZodString>;
    supportEmail: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    businessName: string;
    businessIndustry: string;
    businessDescription: string;
    businessWebsite?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
}, {
    businessName: string;
    businessIndustry: string;
    businessDescription: string;
    businessWebsite?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
}>;
/** Partial business profile update (MCP / external integrations). */
export declare const updateBusinessProfileSchema: z.ZodEffects<z.ZodObject<{
    businessName: z.ZodOptional<z.ZodString>;
    businessWebsite: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, z.ZodOptional<z.ZodString>>>;
    businessIndustry: z.ZodOptional<z.ZodString>;
    businessDescription: z.ZodOptional<z.ZodString>;
    businessLocation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    supportEmail: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    businessName?: string | undefined;
    businessWebsite?: string | undefined;
    businessIndustry?: string | undefined;
    businessDescription?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
}, {
    businessName?: string | undefined;
    businessWebsite?: string | undefined;
    businessIndustry?: string | undefined;
    businessDescription?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
}>, {
    businessName?: string | undefined;
    businessWebsite?: string | undefined;
    businessIndustry?: string | undefined;
    businessDescription?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
}, {
    businessName?: string | undefined;
    businessWebsite?: string | undefined;
    businessIndustry?: string | undefined;
    businessDescription?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
}>;
export declare const onboardingCompleteSchema: z.ZodObject<{
    businessName: z.ZodString;
    businessWebsite: z.ZodOptional<z.ZodString>;
    businessIndustry: z.ZodString;
    businessDescription: z.ZodString;
    businessLocation: z.ZodOptional<z.ZodString>;
    supportEmail: z.ZodOptional<z.ZodString>;
    questions: z.ZodArray<z.ZodString, "many">;
    answers: z.ZodArray<z.ZodString, "many">;
    projectName: z.ZodString;
    projectDescription: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    businessName: string;
    businessIndustry: string;
    businessDescription: string;
    questions: string[];
    answers: string[];
    projectName: string;
    businessWebsite?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
    projectDescription?: string | undefined;
}, {
    businessName: string;
    businessIndustry: string;
    businessDescription: string;
    questions: string[];
    answers: string[];
    projectName: string;
    businessWebsite?: string | undefined;
    businessLocation?: string | undefined;
    supportEmail?: string | undefined;
    projectDescription?: string | undefined;
}>;
export declare const ingestTextSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    sourceType: z.ZodDefault<z.ZodEnum<["text", "faq", "url", "file"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    sourceType: "text" | "faq" | "url" | "file";
}, {
    title: string;
    content: string;
    sourceType?: "text" | "faq" | "url" | "file" | undefined;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    message: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
    visitorName: z.ZodOptional<z.ZodString>;
    visitorEmail: z.ZodOptional<z.ZodString>;
    stream: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    stream: boolean;
    sessionId?: string | undefined;
    visitorName?: string | undefined;
    visitorEmail?: string | undefined;
}, {
    message: string;
    sessionId?: string | undefined;
    visitorName?: string | undefined;
    visitorEmail?: string | undefined;
    stream?: boolean | undefined;
}>;
export declare const createSessionSchema: z.ZodObject<{
    visitorName: z.ZodOptional<z.ZodString>;
    visitorEmail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    visitorName?: string | undefined;
    visitorEmail?: string | undefined;
}, {
    visitorName?: string | undefined;
    visitorEmail?: string | undefined;
}>;
export declare const createWebhookSchema: z.ZodObject<{
    label: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    url: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    events: string[];
    description: string;
    enabled: boolean;
    url: string;
    label: string;
}, {
    events: string[];
    url: string;
    label: string;
    description?: string | undefined;
    enabled?: boolean | undefined;
}>;
export declare const updateWebhookSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    url: z.ZodOptional<z.ZodString>;
    events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    enabled: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    events?: string[] | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    url?: string | undefined;
    label?: string | undefined;
}, {
    events?: string[] | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    url?: string | undefined;
    label?: string | undefined;
}>;
export declare const createSlackIntegrationSchema: z.ZodObject<{
    label: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    webhookUrl: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    events: string[];
    description: string;
    enabled: boolean;
    label: string;
    webhookUrl: string;
}, {
    events: string[];
    webhookUrl: string;
    description?: string | undefined;
    enabled?: boolean | undefined;
    label?: string | undefined;
}>;
export declare const createDiscordIntegrationSchema: z.ZodObject<{
    label: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    webhookUrl: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    events: string[];
    description: string;
    enabled: boolean;
    label: string;
    webhookUrl: string;
}, {
    events: string[];
    webhookUrl: string;
    description?: string | undefined;
    enabled?: boolean | undefined;
    label?: string | undefined;
}>;
export declare const updateIntegrationSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    events?: string[] | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    label?: string | undefined;
}, {
    events?: string[] | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    label?: string | undefined;
}>;
export declare const eventRuleTriggerSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"keyword">;
    keywords: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "keyword";
    keywords: string[];
}, {
    type: "keyword";
    keywords: string[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"regex">;
    pattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "regex";
    pattern: string;
}, {
    type: "regex";
    pattern: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"tool">;
    toolName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "tool";
    toolName: string;
}, {
    type: "tool";
    toolName: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"confidence">;
    maxConfidence: z.ZodEnum<["low", "medium"]>;
}, "strip", z.ZodTypeAny, {
    type: "confidence";
    maxConfidence: "low" | "medium";
}, {
    type: "confidence";
    maxConfidence: "low" | "medium";
}>, z.ZodObject<{
    type: z.ZodLiteral<"intent">;
    intents: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "intent";
    intents: string[];
}, {
    type: "intent";
    intents: string[];
}>]>;
export declare const eventRuleDestinationSchema: z.ZodObject<{
    kind: z.ZodEnum<["webhook", "integration"]>;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "webhook" | "integration";
}, {
    id: string;
    kind: "webhook" | "integration";
}>;
export declare const createEventRuleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    eventType: z.ZodString;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    triggers: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"keyword">;
        keywords: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "keyword";
        keywords: string[];
    }, {
        type: "keyword";
        keywords: string[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"regex">;
        pattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "regex";
        pattern: string;
    }, {
        type: "regex";
        pattern: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"tool">;
        toolName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "tool";
        toolName: string;
    }, {
        type: "tool";
        toolName: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"confidence">;
        maxConfidence: z.ZodEnum<["low", "medium"]>;
    }, "strip", z.ZodTypeAny, {
        type: "confidence";
        maxConfidence: "low" | "medium";
    }, {
        type: "confidence";
        maxConfidence: "low" | "medium";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"intent">;
        intents: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "intent";
        intents: string[];
    }, {
        type: "intent";
        intents: string[];
    }>]>;
    destinations: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["webhook", "integration"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        kind: "webhook" | "integration";
    }, {
        id: string;
        kind: "webhook" | "integration";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    enabled: boolean;
    eventType: string;
    triggers: {
        type: "keyword";
        keywords: string[];
    } | {
        type: "regex";
        pattern: string;
    } | {
        type: "tool";
        toolName: string;
    } | {
        type: "confidence";
        maxConfidence: "low" | "medium";
    } | {
        type: "intent";
        intents: string[];
    };
    destinations: {
        id: string;
        kind: "webhook" | "integration";
    }[];
}, {
    name: string;
    eventType: string;
    triggers: {
        type: "keyword";
        keywords: string[];
    } | {
        type: "regex";
        pattern: string;
    } | {
        type: "tool";
        toolName: string;
    } | {
        type: "confidence";
        maxConfidence: "low" | "medium";
    } | {
        type: "intent";
        intents: string[];
    };
    destinations: {
        id: string;
        kind: "webhook" | "integration";
    }[];
    description?: string | undefined;
    enabled?: boolean | undefined;
}>;
export declare const updateEventRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    eventType: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    triggers: z.ZodOptional<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"keyword">;
        keywords: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "keyword";
        keywords: string[];
    }, {
        type: "keyword";
        keywords: string[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"regex">;
        pattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "regex";
        pattern: string;
    }, {
        type: "regex";
        pattern: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"tool">;
        toolName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "tool";
        toolName: string;
    }, {
        type: "tool";
        toolName: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"confidence">;
        maxConfidence: z.ZodEnum<["low", "medium"]>;
    }, "strip", z.ZodTypeAny, {
        type: "confidence";
        maxConfidence: "low" | "medium";
    }, {
        type: "confidence";
        maxConfidence: "low" | "medium";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"intent">;
        intents: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "intent";
        intents: string[];
    }, {
        type: "intent";
        intents: string[];
    }>]>>;
    destinations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["webhook", "integration"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        kind: "webhook" | "integration";
    }, {
        id: string;
        kind: "webhook" | "integration";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    eventType?: string | undefined;
    triggers?: {
        type: "keyword";
        keywords: string[];
    } | {
        type: "regex";
        pattern: string;
    } | {
        type: "tool";
        toolName: string;
    } | {
        type: "confidence";
        maxConfidence: "low" | "medium";
    } | {
        type: "intent";
        intents: string[];
    } | undefined;
    destinations?: {
        id: string;
        kind: "webhook" | "integration";
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    eventType?: string | undefined;
    triggers?: {
        type: "keyword";
        keywords: string[];
    } | {
        type: "regex";
        pattern: string;
    } | {
        type: "tool";
        toolName: string;
    } | {
        type: "confidence";
        maxConfidence: "low" | "medium";
    } | {
        type: "intent";
        intents: string[];
    } | undefined;
    destinations?: {
        id: string;
        kind: "webhook" | "integration";
    }[] | undefined;
}>;
export declare const customToolParameterSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    required: boolean;
}, {
    name: string;
    description: string;
    required?: boolean | undefined;
}>;
export declare const createCustomToolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    httpMethod: z.ZodDefault<z.ZodEnum<["GET", "POST", "PUT", "PATCH"]>>;
    url: z.ZodString;
    parameters: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        required: boolean;
    }, {
        name: string;
        description: string;
        required?: boolean | undefined;
    }>, "many">>;
    responseKey: z.ZodOptional<z.ZodString>;
    /** Plaintext on write only — never returned from API */
    authHeader: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    enabled: boolean;
    url: string;
    httpMethod: "GET" | "POST" | "PUT" | "PATCH";
    parameters: {
        name: string;
        description: string;
        required: boolean;
    }[];
    responseKey?: string | undefined;
    authHeader?: string | undefined;
}, {
    name: string;
    description: string;
    url: string;
    enabled?: boolean | undefined;
    httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | undefined;
    parameters?: {
        name: string;
        description: string;
        required?: boolean | undefined;
    }[] | undefined;
    responseKey?: string | undefined;
    authHeader?: string | undefined;
}>;
export declare const updateCustomToolSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    httpMethod: z.ZodOptional<z.ZodDefault<z.ZodEnum<["GET", "POST", "PUT", "PATCH"]>>>;
    url: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        required: boolean;
    }, {
        name: string;
        description: string;
        required?: boolean | undefined;
    }>, "many">>>;
    responseKey: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    enabled: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
} & {
    authHeader: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    url?: string | undefined;
    httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | undefined;
    parameters?: {
        name: string;
        description: string;
        required: boolean;
    }[] | undefined;
    responseKey?: string | undefined;
    authHeader?: string | null | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    url?: string | undefined;
    httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | undefined;
    parameters?: {
        name: string;
        description: string;
        required?: boolean | undefined;
    }[] | undefined;
    responseKey?: string | undefined;
    authHeader?: string | null | undefined;
}>;
export declare const testCustomToolSchema: z.ZodObject<{
    args: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    args: Record<string, unknown>;
}, {
    args?: Record<string, unknown> | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type TriggerCondition = z.infer<typeof triggerConditionSchema>;
export type ProactiveTriggerRule = z.infer<typeof proactiveTriggerRuleSchema>;
export type ProactiveTriggersConfig = z.infer<typeof proactiveTriggersConfigSchema>;
export type CustomToolParameter = z.infer<typeof customToolParameterSchema>;
export type CreateCustomToolInput = z.infer<typeof createCustomToolSchema>;
export type UpdateCustomToolInput = z.infer<typeof updateCustomToolSchema>;
//# sourceMappingURL=schemas.d.ts.map