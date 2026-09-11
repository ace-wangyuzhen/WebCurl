import { Button, Layout, Typography } from "antd";

export function App() {
  return (
    <Layout className="app-shell">
      <Layout.Header className="top-toolbar">
        <Typography.Title level={3}>Web Curl</Typography.Title>
      </Layout.Header>
      <Layout.Content className="request-workspace">
        <Button type="primary" aria-label="Send request">
          Send
        </Button>
      </Layout.Content>
    </Layout>
  );
}
