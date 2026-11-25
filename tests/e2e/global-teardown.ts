import { deleteAllTestData } from "../helpers/supabase";

export default async function globalTeardown() {
  await deleteAllTestData();
}
