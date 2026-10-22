export default {
    editor: {
        label: {
            en: 'Asyntai AI Chatbot',
        },
        icon: 'chat',
    },
    triggerEvents: [
        {
            name: 'ready',
            label: { en: 'On chat ready' },
            event: { widgetId: '' },
        },
    ],
    actions: [
        {
            label: { en: 'Open chat' },
            action: 'openChat',
            args: [
                {
                    name: 'Message (optional)',
                    type: 'Text',
                },
            ],
        },
        {
            label: { en: 'Close chat' },
            action: 'closeChat',
        },
    ],
    properties: {
        widgetId: {
            label: { en: 'Widget ID' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
            options: {
                placeholder: 'asyntai_1a2b3c4d5e6f',
            },
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'Your widget ID from the Install page of your Asyntai dashboard, for example asyntai_1a2b3c4d5e6f.',
            },
            propertyHelp: {
                tooltip: 'Copy it from the Install page of your Asyntai dashboard at asyntai.com.',
            },
            /* wwEditor:end */
        },
        userContext: {
            label: { en: 'User context' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
            options: {
                placeholder: '{"name": "Jane", "plan": "Pro"}',
            },
            /* wwEditor:start */
            bindingValidation: {
                type: 'object',
                tooltip:
                    'Bind an object with details about the signed-in user, for example { "name": "Jane", "plan": "Pro" }. The assistant uses them in its answers.',
            },
            propertyHelp: {
                tooltip:
                    'Optional. Bind the current user so the assistant knows who it talks to. You can also type JSON.',
            },
            /* wwEditor:end */
        },
        loadInEditor: {
            label: { en: 'Show the chat in the Editor' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            /* wwEditor:start */
            propertyHelp: {
                tooltip: 'Off by default. The chat always shows in Preview and on the published app.',
            },
            /* wwEditor:end */
        },
        scriptUrl: {
            label: { en: 'Widget script URL (advanced)' },
            type: 'Text',
            section: 'settings',
            defaultValue: '',
            options: {
                placeholder: 'https://widget.asyntai.com/static/js/chat-widget.js',
            },
            /* wwEditor:start */
            propertyHelp: {
                tooltip: 'Leave empty. Only for a custom setup.',
            },
            /* wwEditor:end */
        },
    },
};
