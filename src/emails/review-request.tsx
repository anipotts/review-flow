import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Img,
  Hr,
} from "@react-email/components";

interface ReviewRequestEmailProps {
  customerName: string;
  clientName: string;
  clientLogoUrl?: string;
  brandColor: string;
  baseUrl: string;
  token: string;
}

export function ReviewRequestEmail({
  customerName,
  clientName,
  clientLogoUrl,
  brandColor,
  baseUrl,
  token,
}: ReviewRequestEmailProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <Html>
      <Head />
      <Preview>How was your experience with {clientName}?</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...card, borderTopColor: brandColor }}>
            {/* Logo or Client Name */}
            <Section style={{ textAlign: "center" as const, padding: "24px 0 8px" }}>
              {clientLogoUrl ? (
                <Img
                  src={clientLogoUrl}
                  alt={clientName}
                  width="120"
                  height="40"
                  style={{ margin: "0 auto", display: "block", objectFit: "contain" as const }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: brandColor,
                    margin: "0",
                  }}
                >
                  {clientName}
                </Text>
              )}
            </Section>

            {/* Greeting */}
            <Text style={heading}>
              Hi {customerName}, how was your experience with {clientName}?
            </Text>

            <Text style={subtext}>
              Your feedback helps us improve. Please tap a star below to rate
              your experience:
            </Text>

            {/* Stars */}
            <Section style={{ textAlign: "center" as const, padding: "8px 0 24px" }}>
              <table
                cellPadding="0"
                cellSpacing="0"
                style={{ margin: "0 auto" }}
              >
                <tbody>
                  <tr>
                    {stars.map((rating) => (
                      <td key={rating} style={{ padding: "0 6px" }}>
                        <Link
                          href={`${baseUrl}/r/${token}?s=${rating}`}
                          style={{
                            display: "inline-block",
                            width: "44px",
                            height: "44px",
                            lineHeight: "44px",
                            fontSize: "36px",
                            textAlign: "center" as const,
                            textDecoration: "none",
                            color: "#F59E0B",
                          }}
                        >
                          &#9733;
                        </Link>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {stars.map((rating) => (
                      <td
                        key={rating}
                        style={{
                          textAlign: "center" as const,
                          fontSize: "11px",
                          color: "#9CA3AF",
                          paddingTop: "2px",
                        }}
                      >
                        {rating}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Section>

            <Hr style={divider} />

            {/* Footer */}
            <Text style={footer}>
              Powered by{" "}
              <Link href="https://dadadigital.com" style={{ color: "#6B7280" }}>
                DadaDigital
              </Link>
            </Text>

            {/* Open tracking pixel */}
            <Img
              src={`${baseUrl}/api/track/open/${token}`}
              width="1"
              height="1"
              alt=""
              style={{ display: "block" }}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#F3F4F6",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  padding: "40px 0",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
};

const card = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "0 32px 32px",
  borderTop: "4px solid",
};

const heading = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#111827",
  textAlign: "center" as const,
  lineHeight: "1.5",
  margin: "16px 0 8px",
};

const subtext = {
  fontSize: "14px",
  color: "#6B7280",
  textAlign: "center" as const,
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const divider = {
  borderColor: "#E5E7EB",
  margin: "0 0 16px",
};

const footer = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
  margin: "0",
};

export default ReviewRequestEmail;
