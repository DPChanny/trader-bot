import { SecondarySection } from "@components/surfaces/section";
import { Title, Text } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { Plan } from "@features/subscription/dto";
import { PLAN_AMOUNT, FREE_FEATURES, PLAN_FEATURES } from "./constants";

export function PlanSection() {
  return (
    <SecondarySection fill>
      <Title>구독 플랜</Title>
      <Card variantColor="gray" fill justify="center">
        <Text variantWeight="semibold">Trader Bot Free</Text>
        {FREE_FEATURES.map((f) => (
          <Text key={f} variantSize="small">
            • {f}
          </Text>
        ))}
      </Card>
      <Card variantColor="green" fill justify="center">
        <Text variantWeight="semibold">
          Trader Bot Plus (30일) ₩
          {PLAN_AMOUNT[Plan.PLUS].toLocaleString("ko-KR")}/월
        </Text>
        {PLAN_FEATURES[Plan.PLUS].map((f) => (
          <Text key={f} variantSize="small">
            • {f}
          </Text>
        ))}
      </Card>
      <Card variantColor="gold" fill justify="center">
        <Text variantWeight="semibold">
          Trader Bot Pro (30일) ₩{PLAN_AMOUNT[Plan.PRO].toLocaleString("ko-KR")}
          /월
        </Text>
        {PLAN_FEATURES[Plan.PRO].map((f) => (
          <Text key={f} variantSize="small">
            • {f}
          </Text>
        ))}
      </Card>
    </SecondarySection>
  );
}
