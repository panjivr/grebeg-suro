import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VolunteerDashboard } from "@/components/volunteer-dashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard Volunteer",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [event, profile] = await Promise.all([
    prisma.eventSetting.findFirst({ where: { isActive: true } }),
    prisma.volunteerProfile.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <VolunteerDashboard
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        profilePhoto: user.profilePhoto,
        shift: user.shift,
        division: user.division
          ? { id: user.division.id, name: user.division.name }
          : null,
      }}
      event={
        event
          ? { eventName: event.eventName, radiusMeter: event.radiusMeter, shiftStart: event.shiftStart }
          : null
      }
      profile={
        profile
          ? {
              registeredAt: profile.registeredAt?.toISOString() ?? null,
              birthDate: profile.birthDate?.toISOString() ?? null,
              gender: profile.gender,
              address: profile.address,
              whatsapp: profile.whatsapp,
              email: profile.email,
              socialMedia: profile.socialMedia,
              occupation: profile.occupation,
              medicalHistory: profile.medicalHistory,
              previousCommittee: profile.previousCommittee,
              chosenDivision: profile.chosenDivision,
              ktpPhotoUrl: profile.ktpPhotoUrl,
              diplomaUrl: profile.diplomaUrl,
              photo3x4Url: profile.photo3x4Url,
              cvUrl: profile.cvUrl,
              portfolioUrl: profile.portfolioUrl,
              aiTools: profile.aiTools,
            }
          : null
      }
    />
  );
}
