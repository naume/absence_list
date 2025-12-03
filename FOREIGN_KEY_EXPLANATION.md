# Foreign Key Relationships Explained

## Database Schema Diagram

```
┌─────────────────┐
│    persons      │
├─────────────────┤
│ id (PK) BIGINT  │◄─────┐
│ pass_number     │      │
│ first_name      │      │
│ last_name       │      │
│ team            │      │
│ birth_date      │      │
│ created_at      │      │
│ updated_at      │      │
└─────────────────┘      │
                         │
                         │ Foreign Key
                         │ (person_id)
                         │
┌─────────────────┐      │      ┌─────────────────┐
│  attendance      │      │      │attendance_persons│
├─────────────────┤      │      ├─────────────────┤
│ id (PK) BIGINT  │◄─────┼──────│ attendance_id   │
│ date            │      │      │ person_id       │
│ activity_type   │      │      │ (FK) BIGINT     │
│ total_persons   │      │      │ (FK) BIGINT     │
│ absent          │      │      │ id (PK) BIGINT  │
│ created_at      │      │      │ created_at      │
│ updated_at      │      │      └─────────────────┘
└─────────────────┘      │
                         │
                    Foreign Key
                    (attendance_id)
```

## How Foreign Keys Work

### 1. **Primary Keys (PK)**

- `persons.id` - Unique identifier for each person (BIGINT, auto-increment)
- `attendance.id` - Unique identifier for each attendance record (BIGINT, auto-increment)
- `attendance_persons.id` - Unique identifier for each link (BIGINT, auto-increment)

**Note:** All IDs use `BIGINT` (int8) to match your existing `attendance` table schema.

### 2. **Foreign Keys (FK)**

- `attendance_persons.attendance_id` (BIGINT) → `attendance.id` (BIGINT)
- `attendance_persons.person_id` (BIGINT) → `persons.id` (BIGINT)

### 3. **CASCADE DELETE**

When you delete:

- An **attendance** record → All related `attendance_persons` entries are automatically deleted
- A **person** → All related `attendance_persons` entries are automatically deleted

This prevents "orphaned" records in the junction table.

### 4. **UNIQUE Constraint**

- `(attendance_id, person_id)` in `attendance_persons` ensures:
  - A person can only be marked present **once** per attendance record
  - Prevents duplicate entries

## Example Data Flow

### Creating an Attendance Record:

1. **Insert attendance record:**

   ```sql
   INSERT INTO attendance (date, activity_type, total_persons, absent)
   VALUES ('2025-01-15', 'Training', 10, 2)
   RETURNING id;
   -- Returns: attendance_id = 'abc-123-def'
   ```

2. **Link persons who were present:**

   ```sql
   INSERT INTO attendance_persons (attendance_id, person_id)
   VALUES
     ('abc-123-def', 'person-1-id'),
     ('abc-123-def', 'person-2-id'),
     ('abc-123-def', 'person-3-id');
   ```

3. **Query to get all present persons:**
   ```sql
   SELECT p.*
   FROM persons p
   JOIN attendance_persons ap ON p.id = ap.person_id
   WHERE ap.attendance_id = 'abc-123-def';
   ```

## Benefits of This Structure

✅ **Normalized Data** - No duplicate person information  
✅ **Referential Integrity** - Foreign keys ensure data consistency  
✅ **Easy Queries** - Join tables to get related data  
✅ **Scalable** - Can add more fields to persons without affecting attendance  
✅ **Flexible** - Can query "Who was present on date X?" or "When was person Y present?"

## Common Queries

### Get all persons present on a specific date:

```sql
SELECT p.first_name, p.last_name, p.team
FROM persons p
JOIN attendance_persons ap ON p.id = ap.person_id
JOIN attendance a ON ap.attendance_id = a.id
WHERE a.date = '2025-01-15';
```

### Get attendance history for a person:

```sql
SELECT a.date, a.activity_type
FROM attendance a
JOIN attendance_persons ap ON a.id = ap.attendance_id
WHERE ap.person_id = 'person-id-here';
```

### Count present persons per team:

```sql
SELECT p.team, COUNT(*) as present_count
FROM persons p
JOIN attendance_persons ap ON p.id = ap.person_id
JOIN attendance a ON ap.attendance_id = a.id
WHERE a.date = '2025-01-15'
GROUP BY p.team;
```
