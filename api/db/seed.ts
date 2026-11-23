import 'dotenv/config';
import { hash } from 'argon2';
import db from '../src/common/db/index.js';
import { assessmentQuestions, assessments, listingDocuments, listings as listingsTable, QuestionType, UserRole, users as usersTable } from '../src/common/db/schema.js';
import DATA from './seed_data.json' with {type: 'json'};

export async function seed() {
    console.log(`Writing users...`);
    const users = await db
        .insert(usersTable)
        .values(await Promise.all(
            DATA.users.map(async (u) => ({
                ...u,
                role: u.role as UserRole,
                password: await hash(u.password)
            }))))
        .onConflictDoNothing()
        .returning();

    await db
        .insert(assessments)
        .values(users.map(u => ({
            userId: u.id
        })))
        .onConflictDoNothing();

    console.log(`Writing assessmentQuestions...`);
    await db
        .insert(assessmentQuestions)
        .values(DATA.assessmentQuestions.map(q => ({
            ...q,
            type: q.type as QuestionType
        })))
        .onConflictDoNothing()
        .returning();

    console.log(`Writing listings...`);
    const listings = await db
        .insert(listingsTable)
        .values(DATA.listings.map((l, idx) => {
            const { documents, ...listing } = l;
            return {
                ...listing,
                productImage: `https://picsum.photos/seed/item${idx}/600`
            };
        }))
        .onConflictDoNothing()
        .returning();

    console.log(`Writing listingDocuments...`);
    const documents = listings.flatMap(entry => {
        const data = DATA.listings.find(l => l.slug == entry.slug);
        if (!data) return [];

        return data.documents.map(d => ({
            ...d,
            listingId: entry.id
        } as typeof listingDocuments.$inferInsert))
    });
    await db
        .insert(listingDocuments)
        .values(documents)
        .onConflictDoNothing();

    console.log("DB seeded successfully!");
    process.exit(0);
}

seed().catch((e) => {
    console.error("Seed failed: ");
    console.error(e)
    process.exit(1)
});
