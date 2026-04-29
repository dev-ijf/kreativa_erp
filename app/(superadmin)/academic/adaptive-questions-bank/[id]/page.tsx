'use client';

import { use } from 'react';
import AdaptiveQuestionsBankForm from '@/components/academic/AdaptiveQuestionsBankForm';

export default function EditAdaptiveQuestionsBankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdaptiveQuestionsBankForm recordId={id} />;
}
