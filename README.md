# Asyntai AI Chatbot for WeWeb

Add the [Asyntai](https://asyntai.com) AI chat assistant to your WeWeb app. It
answers visitor questions from your own content, in more than 80 languages.

## Install

1. In your WeWeb workspace, open **Coded components** and import this
   repository from GitHub: `https://github.com/asyntai/weweb-ai-chatbot`.
   When the build is finished, select the newest version.
2. In the Editor, open **Add** and drop **Asyntai AI Chatbot** on a page. Put
   it in a section that every page shares, such as the header, to have the
   chat on the whole app.
3. Paste your widget ID in the **Widget ID** field of the settings panel.
4. Open **Preview** or publish. The chat bubble is in the corner.

## Where the widget ID comes from

Open the Install page in your [Asyntai dashboard](https://asyntai.com/dashboard).
The widget ID is the value of `data-asyntai-id` in the snippet shown there. It
starts with `asyntai_`.

Creating an account is free, and the Free plan is enough to try the widget.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| Widget ID | empty | Your Asyntai widget ID. Bindable |
| User context | empty | Optional. Bind an object about the signed-in user, for example `{ "name": "Jane", "plan": "Pro" }`. You can also type JSON |
| Show the chat in the Editor | off | Shows the real chat while you design. The chat always shows in Preview and on the published app |
| Widget script URL | the Asyntai CDN | Advanced. Leave it empty |

In the Editor the element shows a small box that says if the widget ID is
missing or wrong. Visitors never see it.

## Workflows

| Name | Type | What it does |
| --- | --- | --- |
| Open chat | action | Opens the chat. With a message, the message is put in the input box |
| Close chat | action | Closes the chat |
| On chat ready | trigger | Runs when the chat has loaded |

## What the element does

- It loads the Asyntai widget once. WeWeb changes pages without a reload, so
  the chat stays open between pages and never loads twice.
- It uses WeWeb's front window and document, so it works inside the Editor
  frame and on the published app.
- It writes the user context to `window.Asyntai.userContext`, which the widget
  reads with each message.

## Develop

```bash
npm install
npm test
npm run serve -- --port=8080
npx weweb build --name=weweb-ai-chatbot --type=wwobject
```

Then, in the WeWeb Editor, open the Dev editor and add a local element on the
same port.

## Support

Email [hello@asyntai.com](mailto:hello@asyntai.com), or read the
[WeWeb guide](https://asyntai.com/documentation/integrations/weweb/).
