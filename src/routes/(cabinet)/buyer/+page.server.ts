import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  // Find buyer's unit
  const unit = await db.unit.findFirst({
    where: { buyerId: user.id },
    include: {
      project: {
        include: {
          constructionPhases: { orderBy: { sortOrder: 'asc' } }
        }
      }
    }
  });

  // Buyer's payments (via unit or user)
  const payments = await db.payment.findMany({
    where: { userId: user.id },
    include: { unit: true },
    orderBy: { dueDate: 'asc' }
  });

  // Buyer's documents
  const documents = await db.document.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' }
  });

  // Calculate ROI if unit has price
  let roi = null;
  if (unit?.price) {
    const price = unit.price;
    const grossRental = price * 0.07;
    const managementCost = grossRental * 0.10;
    const netIncome = grossRental - managementCost;
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const vatAmount = price * 0.05;
    const totalCapital = price + vatAmount;
    const netROI = (netIncome / totalCapital) * 100;
    roi = { propertyValue: price, totalPaid, annualYield: netIncome, netROI, paidPercent: Math.round((totalPaid / price) * 100) };
  }

  // Construction progress
  const phases = unit?.project?.constructionPhases ?? [];
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const constructionProgress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const currentPhase = phases.find(p => p.status === 'in_progress')?.name ?? 'Not started';

  // Next upcoming payment
  const nextPayment = payments.find(p => p.status === 'upcoming' || p.status === 'overdue') ?? null;

  // Alert: payment due within 7 days
  const alertPayment = nextPayment && new Date(nextPayment.dueDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    ? nextPayment : null;

  return { unit, payments, documents, roi, constructionProgress, currentPhase, nextPayment, alertPayment };
};
