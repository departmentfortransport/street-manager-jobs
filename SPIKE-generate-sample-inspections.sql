-- Main steps:
--    1. Count how many sample inspections exist for each category for each promoter
--    2. Subtract this from the cap to calculate how many works we need sample inspections for
--    3. Select the required number of eligible work records for each category for each promoter
--    4. Create sample inspection records from these work records and insert into sample inspection table


-- Assumptions:
--    1. Only one admin will be able to generate sample inspections for the HA at a time, otherwise 409 Conflict
--    2. Eligible work records must not already have a sample inspection but can have a scheduled inspection
--    3. Audits will be added in a separate query in a transaction, as with existing operations


------------------------------------------------------------------------------------------------------------------------


-- Steps 1 and 2 logic - This is used in the options below
-- Calculate how many works of each category we need to generate sample inspections for, for each promoter

SELECT
  sample_inspection_target.sample_inspection_target_id,
  sample_inspection_target.promoter_organisation_id,
  cap_category_a - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=1)) AS category_a_to_generate,
  cap_category_b - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=2)) AS category_b_to_generate,
  cap_category_c - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=3)) AS category_c_to_generate
FROM sample_inspection
JOIN "work" ON sample_inspection.work_id = "work".work_id
JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference -- This JOIN can be removed once SM-5196 is played. Then promoter_organisation_id will be available on the "work" table
RIGHT JOIN sample_inspection_target ON sample_inspection_target.sample_inspection_target_id = sample_inspection.sample_inspection_target_id
WHERE ha_organisation_id = 123 -- HA org ID will be available to the job
GROUP BY sample_inspection_target.sample_inspection_target_id, organisation_id;


------------------------------------------------------------------------------------------------------------------------

-- Steps 1 - 4

-- Option 1:
--    Store amount to generate for each promoter and category in temp table.
--    Use temp table to select correct amount of work records using window function to number work rows by promoter
--
--    This would only be possible if only one admin can kick off job at a time for each HA, and HA ID
--    was used in temp table name to avoid conflicts
--
--    This option appears to be the most performant.
--    Tested inserting each category in turn rather than unioning. Didn't seem to have much of an impact

INSERT INTO sample_inspection (
  sample_inspection_reference_number,
  sample_inspection_target_id,
  work_id,
  inspection_category_id,
  works_location_description
)

(
-- Category A
  SELECT
    work_reference_number || '-SI' AS sample_inspection_reference_number,
    sample_inspection_target_id,
    work_id,
    1 AS inspection_category_id,
    latest_works_location_description AS works_location_description
  FROM (
      SELECT
        work_id,
        work_reference_number,
        sample_inspection_to_generate.sample_inspection_target_id,
        sample_inspection_to_generate.category_a_to_generate,
        organisation_id,
        latest_works_location_description,
        ROW_NUMBER() OVER(PARTITION BY promoter_organisation_reference) AS row_num
      FROM
        "work"
        JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference -- This JOIN can be removed once SM-5196 is played. Then promoter_organisation_id will be available on the "work" table
        JOIN sample_inspection_to_generate ON organisation.organisation_id = sample_inspection_to_generate.promoter_organisation_id
        WHERE "work".work_status_id = 2 -- In progress
        AND ha_organisation_reference = 'ABC' -- HA org ID will be available to the job
        AND "work".work_id NOT IN (
          SELECT work_id FROM sample_inspection WHERE inspection_category_id = 1
        )
  ) AS eligible_works
  WHERE row_num <= eligible_works.category_a_to_generate

UNION ALL

-- Category B
  SELECT
    work_reference_number || '-SI' AS sample_inspection_reference_number,
    sample_inspection_target_id,
    work_id,
    2 AS inspection_category_id,
    latest_works_location_description AS works_location_description
  FROM (
      SELECT DISTINCT -- TODO Check performance of DISTINCT vs DISTINCT subquery with ROW_NUMBER()
        "work".work_id,
        "work".work_reference_number,
        sample_inspection_to_generate.sample_inspection_target_id,
        sample_inspection_to_generate.category_b_to_generate,
        organisation_id,
        latest_works_location_description,
        DENSE_RANK() OVER(PARTITION BY "work".promoter_organisation_reference ORDER BY "work".work_id) AS row_num
      FROM
        "work"
        JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference -- This JOIN can be removed once SM-5196 is played. Then promoter_organisation_id will be available on the "work" table
        JOIN sample_inspection_to_generate ON organisation.organisation_id = sample_inspection_to_generate.promoter_organisation_id
        JOIN permit ON permit.work_id = "work".work_id
        JOIN reinstatement ON reinstatement.permit_id = permit.permit_id
        WHERE reinstatement_date >= NOW() - INTERVAL '6 MONTHS' -- TODO Waiting on confirmation on whether to check on reinstatement_date or date_created
        AND "work".ha_organisation_reference = 'ABC' -- Will have this from endpoint
        AND "work".work_id NOT IN (
          SELECT work_id FROM sample_inspection WHERE inspection_category_id = 2
        )
  ) AS eligible_works
  WHERE row_num <= eligible_works.category_b_to_generate

UNION ALL

-- Category C
  SELECT
    work_reference_number || '-SI' AS sample_inspection_reference_number,
    sample_inspection_target_id,
    work_id,
    3 AS inspection_category_id,
    latest_works_location_description AS works_location_description
  FROM (
    SELECT DISTINCT -- TODO Check performance of DISTINCT vs DISTINCT subquery with ROW_NUMBER()
      "work".work_id,
      "work".work_reference_number,
      sample_inspection_to_generate.sample_inspection_target_id,
      sample_inspection_to_generate.category_c_to_generate,
      organisation_id,
      latest_works_location_description,
      DENSE_RANK() OVER(PARTITION BY "work".promoter_organisation_reference) AS row_num
    FROM
      "work"
      JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference -- This JOIN can be removed once SM-5196 is played. Then promoter_organisation_id will be available on the "work" table
      JOIN sample_inspection_to_generate ON organisation.organisation_id = sample_inspection_to_generate.promoter_organisation_id
      JOIN permit ON permit.work_id = "work".work_id
      JOIN reinstatement ON reinstatement.permit_id = permit.permit_id
      WHERE reinstatement_status_id = 2
      AND reinstatement.end_date >= NOW()
      AND reinstatement.end_date <= NOW() + INTERVAL '3 MONTHS'
      AND "work".ha_organisation_reference = 'ABC'
      AND "work".work_id NOT IN (
        SELECT work_id FROM sample_inspection WHERE inspection_category_id = 3
      )
  ) AS eligible_works
  WHERE row_num <= eligible_works.category_c_to_generate
)




-- Option 2:
--    As with Option 1, use a window function to number and select correct number of work records, but with nested query
--    to calculate how many of each to select

-- Category A
INSERT INTO sample_inspection (sample_inspection_reference_number, sample_inspection_target_id, work_id, inspection_category_id, works_location_description)
  SELECT
    CAST(work_id AS VARCHAR) || '-SI' AS sample_inspection_reference_number,
    sample_inspection_target_id,
    work_id,
    1 AS inspection_category_id,
    latest_works_location_description AS works_location_description
  FROM (
      SELECT
          work_id,
          sample_inspection_to_generate.sample_inspection_target_id,
          sample_inspection_to_generate.category_a_to_generate,
          promoter_organisation_reference,
          organisation_id,
          latest_works_location_description,
          ROW_NUMBER() OVER(PARTITION BY promoter_organisation_reference) AS row_num
      FROM
        "work"
        JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference
        JOIN (
          SELECT
            sample_inspection_target.sample_inspection_target_id,
            sample_inspection_target.promoter_organisation_id,
            cap_category_a - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=1)) AS category_a_to_generate,
            cap_category_b - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=2)) AS category_b_to_generate,
            cap_category_c - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=3)) AS category_c_to_generate
          FROM sample_inspection
          JOIN "work" ON sample_inspection.work_id = "work".work_id
          JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference
          RIGHT JOIN sample_inspection_target ON sample_inspection_target.sample_inspection_target_id = sample_inspection.sample_inspection_target_id
          WHERE ha_organisation_id = 39
          GROUP BY sample_inspection_target.sample_inspection_target_id, organisation_id
        ) AS sample_inspection_to_generate
        ON organisation.organisation_id = sample_inspection_to_generate.promoter_organisation_id
        WHERE "work".work_status_id = 2 -- In progress
        AND ha_organisation_reference = 'ABC' -- Will have this from endpoint
        AND "work".work_id NOT IN (
          SELECT work_id FROM sample_inspection WHERE inspection_category_id = 1
        )
  ) AS eligible_works
  WHERE row_num <= eligible_works.category_a_to_generate


-- Option 3:
--    Calculate how sample inspections to create for each promoter
--    Loop over this result set and select work records per promoter using LIMIT

CREATE OR REPLACE FUNCTION generate_sample_inspections(_ha_ref VARCHAR, _ha_id INTEGER) RETURNS void AS $$
DECLARE
    promoter_targets_to_generate record;
BEGIN
  FOR promoter_targets_to_generate IN

    SELECT
      sample_inspection_target.sample_inspection_target_id,
      sample_inspection_target.promoter_organisation_id,
      cap_category_a - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=1)) AS category_a_to_generate,
      cap_category_b - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=2)) AS category_b_to_generate,
      cap_category_c - (COUNT(sample_inspection.id) FILTER (WHERE inspection_category_id=3)) AS category_c_to_generate
    FROM sample_inspection
    JOIN "work" ON sample_inspection.work_id = "work".work_id
    JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference
    RIGHT JOIN sample_inspection_target ON sample_inspection_target.sample_inspection_target_id = sample_inspection.sample_inspection_target_id
    WHERE ha_organisation_id = _ha_id
    GROUP BY sample_inspection_target.sample_inspection_target_id, organisation_id

  LOOP
    -- Category A
    INSERT INTO sample_inspection (sample_inspection_reference_number, sample_inspection_target_id, work_id, inspection_category_id, works_location_description)
    SELECT
        CAST(work_id AS VARCHAR) || '-SI' AS sample_inspection_reference_number,
          promoter_targets_to_generate.sample_inspection_target_id,
          work_id,
          1 AS inspection_category_id,
          latest_works_location_description AS works_location_description
      FROM
          "work"
      JOIN organisation ON organisation.org_ref = "work".promoter_organisation_reference
      WHERE "work".work_status_id = 2
      AND ha_organisation_reference = _ha_ref
      AND organisation.organisation_id = promoter_targets_to_generate.promoter_organisation_id
      AND "work".work_id NOT IN (
        SELECT work_id FROM sample_inspection WHERE inspection_category_id = 1
      )
    LIMIT promoter_targets_to_generate.category_a_to_generate;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT generate_sample_inspections('ABC', 123);


------------------------------------------------------------------------------------------------------------------------

-- Create tables

CREATE TABLE sample_inspection (
  id                                     SERIAL PRIMARY KEY,
  sample_inspection_reference_number     VARCHAR,
  sample_inspection_target_id            INTEGER,
  work_id                                INTEGER,
  inspection_category_id                 INTEGER,
  works_location_description             VARCHAR
);

CREATE TABLE sample_inspection_target (
  sample_inspection_target_id                  SERIAL PRIMARY KEY,
  sample_inspection_target_reference_number    VARCHAR,
  promoter_organisation_id                     INTEGER,
  ha_organisation_id                           INTEGER,
  agreed_category_a                            INTEGER,
  cap_category_a                               INTEGER,
  passed_category_a                            INTEGER,
  failed_category_a                            INTEGER,
  agreed_category_b                            INTEGER,
  cap_category_b                               INTEGER,
  passed_category_b                            INTEGER,
  failed_category_b                            INTEGER,
  agreed_category_c                            INTEGER,
  cap_category_c                               INTEGER,
  passed_category_c                            INTEGER,
  failed_category_c                            INTEGER
);