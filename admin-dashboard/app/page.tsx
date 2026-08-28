import Image from "next/image";
import Link from "next/link";
import {
  School,
  Users,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    title: "School Management",
    text: "Manage multiple schools, departments and academic operations.",
    icon: School,
  },
  {
    title: "Student Intelligence",
    text: "Track students, results, attendance and learning progress.",
    icon: GraduationCap,
  },
  {
    title: "Staff Management",
    text: "Manage teachers, administrators and school personnel.",
    icon: Users,
  },
  {
    title: "Secure Platform",
    text: "Role-based access with enterprise security.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <div
      className="
        min-h-screen
        overflow-hidden
        bg-gradient-to-br
        from-rose-50
        via-white
        to-pink-100
      "
    >
      <section
        className="
          relative
          px-6
          py-8
          lg:px-16
        "
      >
        <div
          className="
            absolute
            right-0
            top-0
            h-[400px]
            w-[400px]
            rounded-full
            bg-rose-200/40
            blur-3xl
          "
        />

        <nav
          className="
            relative
            z-10
            flex
            items-center
            justify-between
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                relative
                h-14
                w-14
                rounded-2xl
                bg-white
                shadow-lg
                overflow-hidden
              "
            >
              <Image
                src="/core1.png"
                alt="CoreOne"
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-rose-600">
                CoreOne
              </h1>

              <p className="text-xs text-gray-500">
                Smart School Platform
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="
              rounded-lg
              bg-rose-600
              px-6
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-lg
              hover:bg-rose-700
              transition
            "
          >
            Login
          </Link>
        </nav>

        <div
          className="
            relative
            z-10
            grid
            lg:grid-cols-2
            gap-10
            items-center
            mt-14
          "
        >
          <div>
            <p
              className="
                text-sm
                font-semibold
                tracking-[0.2em]
                uppercase
                text-rose-600
              "
            >
              The Future of Education Management
            </p>

            <h1
              className="
                mt-4
                text-lg
                sm:text-2xl
                lg:text-3xl
                font-bold
                leading-tight
                tracking-tight
                text-gray-900
              "
            >
              Smart Management.
              <br />
              <span className="text-rose-600">
                Smarter Schools.
              </span>
            </h1>

            <p
              className="
                mt-6
                max-w-lg
                text-base
                leading-7
                text-gray-600
              "
            >
              CoreOne helps schools manage students,
              teachers, parents, academics and daily
              operations through one intelligent,
              secure and easy-to-use platform.
            </p>

            <div className="mt-8 flex gap-3">
              <Link
                href="/login"
                className="
                  rounded-lg
                  bg-rose-600
                  px-7
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-xl
                  hover:bg-rose-700
                  transition
                "
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="
                  rounded-lg
                  border
                  border-rose-200
                  bg-white
                  px-7
                  py-3
                  text-sm
                  font-semibold
                  text-rose-600
                  hover:bg-rose-50
                  transition
                "
              >
                View Platform
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className="
                relative
                h-[330px]
                w-[330px]
                rounded-[32px]
                border
                bg-white
                p-8
                shadow-2xl
              "
            >
              <div className="relative h-full w-full">
                <Image
                  src="/core1.png"
                  alt="CoreOne Logo"
                  fill
                  sizes="330px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="
          px-6
          pb-16
          lg:px-16
          grid
          gap-5
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="
                rounded-2xl
                border
                bg-white
                p-6
                shadow-sm
                transition
                hover:shadow-xl
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-rose-100
                  text-rose-600
                "
              >
                <Icon size={22} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {feature.text}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}