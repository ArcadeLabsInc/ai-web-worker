import AiWorker from "../src/AiWorker";
import WS from "jest-websocket-mock";

describe("AiWorker", () => {
  let server: WS;
  let widget: AiWorker;

  beforeEach(async () => {
    server = new WS("ws://localhost:1234");
    widget = new AiWorker({
      spiderURL: "ws://localhost:1234",
      initMessage: "Hello server"
    });

    await server.connected;
  });

  afterEach(() => {
    WS.clean();
  });

  it("should send init message when connected", async () => {
    expect(await server.nextMessage).toEqual(JSON.stringify({ type: "init", message: "Hello server" }));
  });

  it("should call onJobCompleted callback when job is completed", async () => {
    const mockCallback = jest.fn();
    widget.on("onJobCompleted", mockCallback);

    server.send(JSON.stringify({ type: "jobCompleted", jobId: "1" }));
    expect(mockCallback).toHaveBeenCalledWith("1");
  });

  it("should handle disconnect and reconnect", async () => {
    const connectCallback = jest.fn();
    const disconnectCallback = jest.fn();

    widget.on("onConnected", connectCallback);
    widget.on("onDisconnected", disconnectCallback);

    widget.disconnect();
    expect(disconnectCallback).toHaveBeenCalledTimes(1);

    widget.reconnect();
    await server.connected;

    expect(connectCallback).toHaveBeenCalledTimes(1);
  });
});

