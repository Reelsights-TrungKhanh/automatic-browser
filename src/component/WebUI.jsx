import React, { useState, useRef, useEffect } from "react";
import { Tooltip } from "antd";
import { Layout, Input, Button, Card, Typography, Space, List } from "antd";
import { message } from "antd";
const { Header, Content } = Layout;
const { Text } = Typography;

const WebUI = () => {
  const [url, setUrl] = useState("");
  // const url = "https://app.tango.us/app/workflow/Submit-Text-Input-in-React-App-40851660cc8c44028ca3f08a85d6fdeb";
  const [steps, setSteps] = useState([]);
  const listRef = useRef(null);
  const evtRef = useRef(null);
  const [screenshot, setScreenshot] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [domSnapshots, setDomSnapshots] = useState([]); // lưu DOM từ server
  const [analysisHtml, setAnalysisHtml] = useState(""); // lưu kết quả phân tích từ Gemini
  const urlServer = 'http://localhost:4000';
  const handleRunAgent = () => {
    if (!url) return;
    setSteps([]); // reset logs
    setDomSnapshots([]); // reset DOM mỗi lần run

    // close previous SSE if any
    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }

    const src = new EventSource(
      // `https://server-auto-tango.onrender.com/run-tango-sse?url=${encodeURIComponent(url)}`
      // `https://puppeteer-server-101915356884.asia-southeast1.run.app/run-tango-sse?url=${encodeURIComponent(url)}`
      `${urlServer}/run-tango-sse?url=${encodeURIComponent(url)}`
    );
    evtRef.current = src;

    src.onmessage = (e) => {
      const data = e.data;

      if (data.startsWith("DOM:")) {
        const jsonStr = data.replace(/^DOM:/, "");
        try {
          const domObj = JSON.parse(jsonStr);
          // lưu DOM vào state như hiện tại
          setDomSnapshots((prev) => [...prev, domObj]);
          // log ra console
          console.log("DOM received:", domObj);
        } catch (err) {
          console.error("Error parsing DOM:", err);
        }
      } else if (data.startsWith("SCREENSHOT:")) {
        const base64 = data.replace("SCREENSHOT:", "");
        setScreenshot(base64); // luôn cập nhật ảnh mới nhất
      } else {
        setSteps((prev) => [...prev, data]);
      }
    };

    src.onerror = () => {
      // close on error / end
      try { src.close(); } catch (err) { }
      evtRef.current = null;
    };
    console.log("dom", domSnapshots);
  };

  // auto-scroll when steps change
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // smooth scroll to bottom
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [steps]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (evtRef.current) try { evtRef.current.close(); } catch (err) { }
    };
  }, []);


  const handleAnalyzeDom = async () => {
    if (!prompt) {
      message.warning("Enter a prompt first");
      return;
    }
    if (domSnapshots.length === 0) {
      message.error("No DOM to analyze");
      return;
    }

    try {
      const latestDom = domSnapshots[domSnapshots.length - 1].html;
      const res = await fetch(`${urlServer}/analyze-dom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: latestDom, userPrompt: prompt }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisHtml(data.analysis); // Gemini trả ra HTML
      } else {
        setAnalysisHtml("<p>No information found</p>");
      }
    } catch (err) {
      console.error(err);
      message.error("Error analyzing DOM");
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ background: "#001529", color: "white", fontSize: 18 }}>
        WebUI with Tango URL Demo
      </Header>

      {/* ensure content area has definite height so children flex correctly */}
      <Content
        style={{
          padding: 16,
          height: "calc(100vh - 64px)",
          display: "grid",
          gridTemplateColumns: "2fr 4fr",
          gap: 16,
        }}
      >
        {/* left column: controls + step-by-step */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
          <Card title="Controls">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {/* Link + nút */}
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  placeholder="Enter Tango URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  onClick={handleRunAgent}
                  style={{ width: 70 }} // cố định để bằng với nút Clear
                >
                  Put
                </Button>
              </div>

              {/* Prompt + nút */}
              <div style={{ display: "flex", gap: 8 }}>
                <Input.TextArea
                  rows={2}
                  placeholder="Enter your prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{ flex: 1, resize: "none" }}
                />
                <Tooltip title={(domSnapshots.length === 0) ? "You must put a URL and perform actions before analyzing" : ""}>
                  <Button
                    type="primary"
                    onClick={handleAnalyzeDom}
                    style={{ width: 70 }}
                    disabled={!prompt || domSnapshots.length === 0}
                  >
                    Analyze
                  </Button>
                </Tooltip>

              </div>
            </Space>
          </Card>


          <Card title="AI Analysis Result" style={{ flex: "0 0 38vh", overflowY: "auto" }}>
            <div
              dangerouslySetInnerHTML={{ __html: analysisHtml }}
            />
          </Card>
          {/* Step card: flex so inner div can grow, minHeight:0 is important */}
          <Card
            title="Step-by-step Actions"
            bordered
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1 1 30vh", // allow it to take remaining space, but prefer up to 45vh
              minHeight: 0,      // CRITICAL for child to be able to scroll
              maxHeight: "30vh", // your requested max height
            }}
            bodyStyle={{ padding: 0, overflow: "hidden" }} // hide overflow on card body, inner div scrolls
          >
            {/* scrollable area */}
            <div
              ref={listRef}
              style={{
                height: "100%",
                overflowY: "auto",
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <List
                dataSource={steps}
                renderItem={(item, idx) => (
                  <List.Item style={{ whiteSpace: "pre-wrap" }}>
                    <Text>{idx + 1}. {item}</Text>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </div>

        {/* right column: placeholder for screenshot / live panel */}
        <Card title="Live Browser Panel" style={{ height: "100%", overflow: "hidden" }}>
          {screenshot ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                width: "100%",
                backgroundColor: "#000", // optional, nhìn đẹp hơn khi ảnh không full
              }}
            >
              <img
                src={`data:image/png;base64,${screenshot}`}
                alt="Latest step"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </div>
          ) : (
            <Text type="secondary">Screenshot / live view.</Text>
          )}
        </Card>




      </Content>
    </Layout>
  );
}
export default WebUI;