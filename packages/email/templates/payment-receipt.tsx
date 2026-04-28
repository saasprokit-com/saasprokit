import { Link } from "@react-email/components";
import {
  Banner,
  DetailItem,
  DetailsBox,
  EmailLayout,
  EmailText,
  Heading,
  ReceiptTable,
} from "../components";
import { colors } from "../components/theme/colors";
import { typography } from "../components/theme/typography";

interface PaymentReceiptProps {
  userName?: string;
  invoiceNumber?: string;
  amount?: string;
  planName?: string;
  billingPeriod?: string;
  paymentMethod?: string;
  paymentDate?: string;
  receiptUrl?: string;
}

export default function PaymentReceipt({
  userName = "there",
  invoiceNumber = "INV-2024-001234",
  amount = "$19.00",
  planName = "Pro",
  billingPeriod = "Dec 13, 2024 - Jan 13, 2025",
  paymentMethod = "Visa ending in 4242",
  paymentDate = "December 13, 2024",
  receiptUrl = "https://example.com/receipts/xxx",
}: PaymentReceiptProps) {
  return (
    <EmailLayout
      footerContent="Questions about your bill? Contact our support team anytime."
      preview={`Payment receipt for ${amount}`}
    >
      <Banner variant="success">Payment Successful</Banner>

      <Heading>Payment Receipt</Heading>

      <EmailText>Hi {userName},</EmailText>

      <EmailText>
        Thank you for your payment. Here's your receipt for your records.
      </EmailText>

      {/* Receipt table using Outlook-compatible Row/Column layout */}
      <ReceiptTable
        companyName="SaaS App"
        invoiceNumber={invoiceNumber}
        items={[
          { label: `${planName} Plan`, value: amount },
          { label: "Billing Period", value: billingPeriod },
        ]}
        total={amount}
      />

      <DetailsBox>
        <DetailItem label="Payment Method" value={paymentMethod} />
        <DetailItem isLast label="Payment Date" value={paymentDate} />
      </DetailsBox>

      <EmailText>
        <Link href={receiptUrl} style={linkStyle}>
          Download PDF Receipt
        </Link>
      </EmailText>

      <EmailText variant="muted">
        Thank you for being a SaaS App subscriber!
      </EmailText>
    </EmailLayout>
  );
}

const linkStyle = {
  color: colors.link,
  fontSize: typography.fontSize.sm,
};
