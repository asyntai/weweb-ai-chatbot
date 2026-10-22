<template>
    <div class="asyntai-ai-chatbot" :class="{ 'asyntai-ai-chatbot--editor': isEditor }">
        <!-- wwEditor:start -->
        <div v-if="isEditor" class="asyntai-ai-chatbot__card">
            <div class="asyntai-ai-chatbot__title">Asyntai AI Chatbot</div>
            <div v-if="idState.error === 'missing'" class="asyntai-ai-chatbot__text">
                Paste your widget ID in the settings panel. Copy it from the Install page of your
                <a class="ww-editor-link" href="https://asyntai.com/dashboard" target="_blank" rel="noopener">Asyntai dashboard</a>,
                for example asyntai_1a2b3c4d5e6f.
            </div>
            <div v-else-if="idState.error === 'invalid'" class="asyntai-ai-chatbot__text">
                "{{ idState.widgetId }}" does not look like a widget ID. It starts with asyntai_, for example
                asyntai_1a2b3c4d5e6f.
            </div>
            <div v-else class="asyntai-ai-chatbot__text">
                Widget {{ idState.widgetId }}. The chat bubble shows in Preview and on the published app. This box
                shows only in the Editor.
            </div>
        </div>
        <!-- wwEditor:end -->
    </div>
</template>

<script>
import {
    applyUserContext,
    closeChat,
    loadWidget,
    normalizeWidgetId,
    openChat,
    widgetReady,
} from './loader.js';

export default {
    props: {
        content: { type: Object, required: true },
        uid: { type: String, required: true },
    },
    emits: ['trigger-event'],
    data() {
        return {
            isEditor: false,
            pendingOpen: null,
            readyHandler: null,
        };
    },
    computed: {
        idState() {
            return normalizeWidgetId(this.content.widgetId);
        },
        frontWindow() {
            return typeof wwLib !== 'undefined' ? wwLib.getFrontWindow() : window;
        },
        frontDocument() {
            return typeof wwLib !== 'undefined' ? wwLib.getFrontDocument() : document;
        },
        shouldLoad() {
            /* wwEditor:start */
            if (!this.content.loadInEditor) return false;
            /* wwEditor:end */
            return !this.idState.error;
        },
    },
    watch: {
        'content.userContext': {
            deep: true,
            handler(value) {
                applyUserContext(this.frontWindow, value);
            },
        },
        shouldLoad(value) {
            if (value) this.start();
        },
    },
    created() {
        /* wwEditor:start */
        this.isEditor = true;
        /* wwEditor:end */
    },
    mounted() {
        applyUserContext(this.frontWindow, this.content.userContext);
        this.listenForReady();
        if (this.shouldLoad) {
            this.start();
        } else if (!this.isEditor && this.idState.error) {
            console.warn(
                'Asyntai AI Chatbot: the chat is off because the widget ID is ' +
                    (this.idState.error === 'missing' ? 'empty.' : 'not valid: "' + this.idState.widgetId + '".')
            );
        }
    },
    beforeUnmount() {
        if (this.readyHandler) {
            this.frontWindow.removeEventListener('asyntai:ready', this.readyHandler);
            this.readyHandler = null;
        }
    },
    methods: {
        start() {
            loadWidget(this.frontDocument, this.idState.widgetId, this.content.scriptUrl);
            if (widgetReady(this.frontWindow)) this.onReady();
        },
        listenForReady() {
            this.readyHandler = () => this.onReady();
            this.frontWindow.addEventListener('asyntai:ready', this.readyHandler);
        },
        onReady() {
            if (this.pendingOpen !== null) {
                const message = this.pendingOpen;
                this.pendingOpen = null;
                openChat(this.frontWindow, message);
            }
            this.$emit('trigger-event', { name: 'ready', event: { widgetId: this.idState.widgetId } });
        },
        /* Workflow action: open the chat, optionally with a message in the input box. */
        openChat(message) {
            if (!openChat(this.frontWindow, message)) {
                // The widget is still loading. Open it as soon as it is ready.
                this.pendingOpen = typeof message === 'string' ? message : '';
            }
        },
        /* Workflow action: close the chat. */
        closeChat() {
            this.pendingOpen = null;
            closeChat(this.frontWindow);
        },
    },
};
</script>

<style lang="scss" scoped>
.asyntai-ai-chatbot {
    width: 0;
    height: 0;
    overflow: hidden;

    /* wwEditor:start */
    &--editor {
        width: 100%;
        height: auto;
        overflow: visible;
    }
    &__card {
        border: 1px solid #d4d4d4;
        border-radius: 8px;
        background: #ffffff;
        color: #111111;
        padding: 12px 14px;
        font-size: 13px;
        line-height: 1.45;
    }
    &__title {
        font-weight: 600;
        margin-bottom: 4px;
    }
    .ww-editor-link {
        display: unset;
        color: #111111;
        text-decoration: underline;
    }
    /* wwEditor:end */
}
</style>
