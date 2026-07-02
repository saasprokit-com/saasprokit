import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ArticlePublishedProps {
  analyticsUrl?: string;
  articleExcerpt?: string;
  articleTitle?: string;
  articleUrl?: string;
  coverImageUrl?: string;
  dashboardUrl?: string;
  publishedAt?: string;
  userName?: string;
}

export default function ArticlePublished({
  userName = "there",
  articleTitle = "Getting Started with Next.js 15",
  articleExcerpt = "Learn how to build modern web applications with the latest features in Next.js 15, including improved performance and developer experience.",
  articleUrl = "https://example.com/articles/getting-started-nextjs-15",
  coverImageUrl,
  publishedAt = "December 13, 2024 at 2:30 PM",
  dashboardUrl = "https://example.com/dashboard",
  analyticsUrl = "https://example.com/dashboard/analytics",
}: ArticlePublishedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your article "{articleTitle}" is now live!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={successBanner}>
            <Text style={successText}>Article Published</Text>
          </Section>

          <Heading style={h1}>Your Article is Live!</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Congratulations! Your article has been published and is now visible
            to your readers.
          </Text>

          <Section style={articleCard}>
            {coverImageUrl && (
              <Img
                alt={articleTitle}
                src={coverImageUrl}
                style={coverImage}
                width="100%"
              />
            )}
            <Section style={articleContent}>
              <Text style={articleTitle_}>{articleTitle}</Text>
              <Text style={articleExcerpt_}>{articleExcerpt}</Text>
              <Text style={publishedDate}>Published: {publishedAt}</Text>
            </Section>
          </Section>

          <Section style={buttonContainer}>
            <Button href={articleUrl} style={primaryButton}>
              View Article
            </Button>
          </Section>

          <Section style={statsBox}>
            <Text style={statsTitle}>Track Your Article's Performance</Text>
            <Text style={statsText}>
              Monitor views, engagement, and reader feedback from your
              dashboard. Early promotion can help your article reach more
              readers!
            </Text>
          </Section>

          <Section style={tipsBox}>
            <Text style={tipsTitle}>Tips to boost engagement:</Text>
            <Text style={tipItem}>Share on social media</Text>
            <Text style={tipItem}>Add to your newsletter</Text>
            <Text style={tipItem}>Engage with comments</Text>
          </Section>

          <Section style={buttonRow}>
            <Button href={analyticsUrl} style={secondaryButton}>
              View Analytics
            </Button>
            <Button href={dashboardUrl} style={secondaryButton}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Keep creating great content! Your readers appreciate it.
          </Text>

          <Text style={footer}>
            Need help promoting your article? Check out our tips for increasing
            reach and engagement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const successBanner = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const successText = {
  color: "#166534",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const articleCard = {
  border: "1px solid #e6ebf1",
  borderRadius: "8px",
  overflow: "hidden",
  margin: "24px 0",
};

const coverImage = {
  display: "block",
  width: "100%",
  objectFit: "cover" as const,
};

const articleContent = {
  padding: "20px",
};

const articleTitle_ = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
  lineHeight: "24px",
};

const articleExcerpt_ = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
};

const publishedDate = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const primaryButton = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const statsBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const statsTitle = {
  color: "#0369a1",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const statsText = {
  color: "#0369a1",
  fontSize: "14px",
  margin: "0",
  lineHeight: "22px",
};

const tipsBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const tipsTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const tipItem = {
  color: "#b45309",
  fontSize: "14px",
  margin: "0 0 4px",
};

const buttonRow = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const secondaryButton = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  color: "#6366f1",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 20px",
  border: "1px solid #6366f1",
  marginRight: "12px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
};
