import React, { useState } from "react";
import { Layout, Input, Button, Card, Typography, Space, List } from "antd";

const { Header, Content } = Layout;
const { Text } = Typography;

export default function App() {
  const [url, setUrl] = useState("");
  // const url ="https://app.tango.us/app/workflow/Create-User-Profile-in-React-App-505329fa625e4769a28a950d0a3c1570";
  const [prompt, setPrompt] = useState("");
  const [steps, setSteps] = useState([]);
  const [screenshot, setScreenshot] = useState(null);

  // Chạy Agent (gửi URL + prompt lên server)
  const handleRunAgent = async () => {
    if (!url) return;

    try {
      const res = await fetch("https://server-auto-tango.onrender.com/run-tango", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, prompt }),
      });
      const data = await res.json();

      // Hiển thị screenshot trả về từ Puppeteer
      setScreenshot(`data:image/png;base64,${data.screenshot}`);
      setSteps((prev) => [
        ...prev,
        `Ran agent on URL: ${url}`,
        prompt ? `Prompt: ${prompt}` : "No prompt provided",
      ]);
      setPrompt("");
    } catch (err) {
      console.error(err);
      setSteps((prev) => [...prev, "Failed to run agent"]);
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ background: "#001529", color: "white", fontSize: 18 }}>
        WebUI + Tango URL Agent Demo
      </Header>
      <Content
        style={{
          padding: 16,
          display: "grid",
          gridTemplateColumns: "2fr 4fr",
          gap: 16,
          height: "calc(100vh - 64px)",
        }}
      >
        {/* Left side */}
        <Space direction="vertical" style={{ width: "100%", height: "100%" }}>
          <Card title="Controls" bordered>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="Enter Tango URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Input
                placeholder="Enter prompt (optional)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button type="primary" onClick={handleRunAgent}>
                Run Agent
              </Button>
            </Space>
          </Card>

          <Card
            title="Step-by-step Actions"
            bordered
            style={{ height: "100%", flex: 1, overflowY: "auto" }}
          >
            <List
              dataSource={steps}
              renderItem={(item, idx) => (
                <List.Item>
                  <Text>{idx + 1}. {item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Space>

        {/* Right side: Live browser / screenshot panel */}
        <Card
          title="Live Browser Panel"
          bordered
          style={{ height: "90%", display: "flex", flexDirection: "column" }}
          bodyStyle={{ flex: 1, padding: 10 }}
        >
          {screenshot ? (
            <img
              src={screenshot}
              alt="Agent Screenshot"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8, border: "1px solid #d9d9d9" }}
            />
          ) : (
            <Text type="secondary" style={{ padding: 16 }}>
              Enter Tango URL and click "Run Agent" to preview steps...
            </Text>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
