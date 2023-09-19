import AiWorker from "../src/AiWorker";
import WS from "jest-websocket-mock";

describe("AiWorker", () => {
  let server: WS;
  let widget: AiWorker;

  beforeEach(async () => {
    jest.useRealTimers()
    server = new WS("ws://127.0.0.1:1234");
    widget = new AiWorker({
      spiderURL: "ws://127.0.0.1:1234",
      initMessage: "Hello server"
    });
    await server.connected
  });

  afterEach(() => {
    WS.clean();
  });

  it("should send init message when connected", async () => {
    expect(await server.nextMessage).toEqual(JSON.stringify(widget.initMessage()));
  });

  it("should call jobDone callback when job is completed", async () => {
    const mockCallback = jest.fn();
    widget.on("jobDone", mockCallback);

    server.send(JSON.stringify({openai_url: "/v1/chat/completion", openai_req: { model: "vicuna-v1-7b-q4f32_0", messages: {"role": "user", content: "hello"} }}));

    await new Promise((r) => setTimeout(r, 500));

    expect(mockCallback).toHaveBeenCalled();
  });

  it("should handle disconnect and reconnect", async () => {
    const connectCallback = jest.fn();
    const disconnectCallback = jest.fn();

    widget.on("connect", connectCallback);
    widget.on("disconnect", disconnectCallback);

    widget.disconnect();
    
    await new Promise((r) => setTimeout(r, 500));
    
    expect(disconnectCallback).toHaveBeenCalledTimes(1);

    widget.reconnect();
    await server.connected;

    await new Promise((r) => setTimeout(r, 500));
    
    expect(connectCallback).toHaveBeenCalledTimes(1);
  });
});

