import WebSocket from 'ws';
import ChatModule from "@mlc-ai/web-llm";

// AiWorker.ts
type Config = {
  spiderURL: string;
  initMessage: string;
  [key: string]: any;
};

type Callbacks = {
  jobStart?: () => void;
  jobDone?: () => void;
  connect?: () => void;
  disconnect?: () => void;
  [key: string]: any;
};

class AiWorker {
  private websocket: WebSocket | null = null;
  private config: Config;
  private callbacks: Callbacks = {};
  chat: ChatModule;
  model: any;

  constructor(config: Config) {
    this.config = config;
    this.connect();
    this.chat = new ChatModule();
    this.chat.setInitProgressCallback((report: any)=>{
        console.log("init", report)
    })
  }

  public on(event: string, callback: any) {
    this.callbacks[event] = callback;
  }

  public disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  private async handleOpenAiReq(req: any) {
    if (req.model != this.model) {
        await this.chat.reload(req.model);
    }

    await this.chat.resetChat();
    // @ts-ignore
    const conversation = this.chat.getPipeline().conversation; 
    for (let i = 0; i < req.messages.length - 1; i++) {
        const message = req.messages[i];
        if (message.role === "system") {
            conversation.system = message.content;
        }
        let inp: string; // Assuming 'inp' is defined somewhere as a string
        if (message.role === "user") {
            conversation.appendMessage(conversation.config.roles[0], message.content);
        } else {
            conversation.appendMessage(conversation.config.roles[1], message.content);
        }
    }
    function progress(report: any) {
        console.log(report)
    }
    const reply = this.chat.generate(req.messages[req.messages.length = 1], progress)
    console.log(reply)
    this.websocket?.send(JSON.stringify({ choices: [{"message": {"role": "assistant", "content": reply}}]}))
  }

  public initMessage() {
      return {
          "ln_url": "simulx@getalby.com",
          "cpu_count": 8,
          "disk_space": 500,
          "vram": 2048,
          "nv_gpu_count": 1,
          "nv_driver_version": "465.19.01",
          "nv_gpus": [
              {
                  "name": "NVIDIA Tesla K80",
                  "memory": 11441
              }
          ]
      }
  }

  private connect() {
    this.websocket = new WebSocket(this.config.spiderURL);
    this.websocket.addEventListener("open", () => {
      this.websocket?.send(JSON.stringify({ type: "init", message: this.initMessage() }));
      this.callbacks.connect?.();
    });

    this.websocket.addEventListener("message", async (event: any) => {
      const data = JSON.parse(event.data);
      if (data.openai_req) {
        this.callbacks.jobStart?.();
        await this.handleOpenAiReq(data.openai_req)
        this.callbacks.jobDone?.();
      }
    });

    this.websocket.addEventListener("close", () => {
      this.callbacks.disconnect?.();
    });
  }
}

// Export for use in other modules
export default AiWorker;

