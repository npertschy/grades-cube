import WelcomeScreen from "@/views/home/WelcomeScreen.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: WelcomeScreen
    },
    {
      path: "/management",
      name: "management",
      component: () => import("@/views/management/ManagementView.vue"),
      children: [
        {
          path: "schoolYear",
          name: "schoolYearManagement",
          component: () =>
            import("@/views/management/SchoolYearManagement.vue"),
        },
        {
          path: "student",
          name: "studentManagement",
          component: () => import("@/views/management/StudentManagement.vue"),
        },
        {
          path: "group",
          name: "groupManagement",
          component: () => import("@/views/management/GroupManagement.vue"),
        },
        {
          path: "subject",
          name: "subjectManagement",
          component: () => import("@/views/management/SubjectManagement.vue"),
        },
        {
          path: "course",
          name: "courseManagement",
          component: () => import("@/views/management/CourseManagement.vue"),
        },
      ],
    },
    {
      path: "/evaluation",
      name: "evaluation",
      component: () => import("@/views/evaluation/EvaluationView.vue"),
    },
    {
      path: "/configuration",
      name: "configuration",
      component: () => import("@/views/configuration/ConfigurationView.vue"),
    },
  ],
});

export default router;
