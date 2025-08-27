import React, { useState, useRef, useEffect } from "react";
import { Layout, Input, Button, Card, Typography, Space, List } from "antd";
const { Header, Content } = Layout;
const { Text } = Typography;

export default function App() {
  const [url, setUrl] = useState("");
  const [steps, setSteps] = useState([]);
  const listRef = useRef(null);
  const evtRef = useRef(null);

  const handleRunAgent = () => {
    if (!url) return;
    setSteps([]); // reset logs

    // close previous SSE if any
    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }

    const src = new EventSource(
      `https://server-auto-tango.onrender.com/run-tango-sse?url=${encodeURIComponent(url)}`
      // `http://localhost:4000/run-tango-sse?url=${encodeURIComponent(url)}`
    );
    evtRef.current = src;

    src.onmessage = (e) => {
      setSteps((prev) => [...prev, e.data]);
    };
    src.onerror = () => {
      // close on error / end
      try { src.close(); } catch {}
      evtRef.current = null;
    };
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
      if (evtRef.current) try { evtRef.current.close(); } catch {}
    };
  }, []);

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ background: "#001529", color: "white", fontSize: 18 }}>
        WebUI + Tango URL Agent Demo
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
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="Enter Tango URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button type="primary" onClick={handleRunAgent}>
                Run Agent
              </Button>
            </Space>
          </Card>

          {/* Step card: flex so inner div can grow, minHeight:0 is important */}
          <Card
            title="Step-by-step Actions"
            bordered
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1 1 45vh", // allow it to take remaining space, but prefer up to 45vh
              minHeight: 0,      // CRITICAL for child to be able to scroll
              maxHeight: "45vh", // your requested max height
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
        <Card title="Live Browser Panel" style={{ height: "100%" }}>
          <Text type="secondary">Screenshot / live view will appear here.</Text>
        </Card>
      </Content>
    </Layout>
  );
}