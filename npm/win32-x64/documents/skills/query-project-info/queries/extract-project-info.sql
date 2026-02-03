SELECT 
    -- Basic Info
    COALESCE(p_name.value_string, 'Undefined') as ProjectName,
    COALESCE(p_num.value_string, 'Undefined') as ProjectNumber,
    COALESCE(client.value_string, 'Undefined') as ClientName,
    COALESCE(status.value_string, 'Undefined') as ProjectStatus,
    
    -- Dates & People
    COALESCE(issue.value_string, 'Undefined') as IssueDate,
    COALESCE(author.value_string, 'Undefined') as Author,

    -- Building Info
    COALESCE(b_name.value_string, 'Undefined') as BuildingName,
    COALESCE(address.value_string, 'Undefined') as ProjectAddress,
    COALESCE(org_name.value_string, 'Undefined') as OrganizationName,
    
    -- Element ID (for reference)
    e.element_id

FROM elements e

-- Joints using Stable Parameter IDs (More Robust than Names)
-- Project Name (-1006317)
LEFT JOIN element_parameters p_name ON e.element_id = p_name.element_id AND p_name.parameter_id = -1006317

-- Project Number (-1006316)
LEFT JOIN element_parameters p_num ON e.element_id = p_num.element_id AND p_num.parameter_id = -1006316

-- Client Name (-1006319)
LEFT JOIN element_parameters client ON e.element_id = client.element_id AND client.parameter_id = -1006319

-- Building Name (-1019006)
LEFT JOIN element_parameters b_name ON e.element_id = b_name.element_id AND b_name.parameter_id = -1019006

-- Organization Name (-1019008)
LEFT JOIN element_parameters org_name ON e.element_id = org_name.element_id AND org_name.parameter_id = -1019008

-- Project Status (-1006320)
LEFT JOIN element_parameters status ON e.element_id = status.element_id AND status.parameter_id = -1006320

-- Project Issue Date (-1006321)
LEFT JOIN element_parameters issue ON e.element_id = issue.element_id AND issue.parameter_id = -1006321

-- Project Address (-1006318)
LEFT JOIN element_parameters address ON e.element_id = address.element_id AND address.parameter_id = -1006318

-- Author (-1019005)
LEFT JOIN element_parameters author ON e.element_id = author.element_id AND author.parameter_id = -1019005

-- Join File Path for Discipline Inference (from any Sheet, usually Sheet Name is stable enough but File Path is safer if available)
LEFT JOIN element_parameters ep_path_ref ON e.element_id = ep_path_ref.element_id -- (This join logic needs to come from a subquery or cross join if we want file path on main info row)

WHERE 
    e.category_name = 'Project Information'
LIMIT 1
```

**Wait**, I cannot easily JOIN `Sheets` into the `Project Information` query without a common key or cross join (which might be heavy).
Better approach: Use a **scalar subquery** to get the filename (like I did for the `get-document-path.sql`) and then apply the CASE logic on that string.

```sql
SELECT 
    -- Basic Info
    COALESCE(p_name.value_string, 'Undefined') as ProjectName,
    COALESCE(p_num.value_string, 'Undefined') as ProjectNumber,
    COALESCE(client.value_string, 'Undefined') as ClientName,
    COALESCE(status.value_string, 'Undefined') as ProjectStatus,
    
    -- Dates & People
    COALESCE(issue.value_string, 'Undefined') as IssueDate,
    COALESCE(author.value_string, 'Undefined') as Author,

    -- Building Info
    COALESCE(b_name.value_string, 'Undefined') as BuildingName,
    COALESCE(address.value_string, 'Undefined') as ProjectAddress,
    COALESCE(org_name.value_string, 'Undefined') as OrganizationName,

    -- Inferred Discipline (System-Aware & Content-Based)
    CASE 
        -- 1. Check for specific Piping System dominances (Resolved via System Type ElementID)
        -- We join the pipe's 'System Type' parameter (value_int) to the elements table to get the system's Type Name.
        
        WHEN (
            SELECT COUNT(*) 
            FROM elements e_pipe 
            JOIN element_parameters p_sys_ref ON e_pipe.element_id = p_sys_ref.element_id 
            JOIN parameter_catalog pc_sys_ref ON p_sys_ref.parameter_id = pc_sys_ref.parameter_id
            -- Join to the System Element using the parameter value (ElementID)
            JOIN elements e_system ON p_sys_ref.value_int = e_system.element_id
            -- Get the System's "Type Name" parameter
            JOIN element_parameters p_type_name ON e_system.element_id = p_type_name.element_id
            JOIN parameter_catalog pc_type_name ON p_type_name.parameter_id = pc_type_name.parameter_id
            
            WHERE e_pipe.category_name = 'Pipes' 
            AND pc_sys_ref.parameter_name = 'System Type'
            AND pc_type_name.parameter_name = 'Type Name'
            AND (p_type_name.value_string LIKE '%Sanitary%' OR p_type_name.value_string LIKE '%Domestic%' OR p_type_name.value_string LIKE '%Waste%' OR p_type_name.value_string LIKE '%Vent%')
        ) > 50 THEN 'Plumbing'

        WHEN (
            SELECT COUNT(*) 
            FROM elements e_pipe 
            JOIN element_parameters p_sys_ref ON e_pipe.element_id = p_sys_ref.element_id 
            JOIN parameter_catalog pc_sys_ref ON p_sys_ref.parameter_id = pc_sys_ref.parameter_id
            JOIN elements e_system ON p_sys_ref.value_int = e_system.element_id
            JOIN element_parameters p_type_name ON e_system.element_id = p_type_name.element_id
            JOIN parameter_catalog pc_type_name ON p_type_name.parameter_id = pc_type_name.parameter_id
            
            WHERE e_pipe.category_name = 'Pipes' 
            AND pc_sys_ref.parameter_name = 'System Type' 
            AND pc_type_name.parameter_name = 'Type Name'
            AND (p_type_name.value_string LIKE '%Fire%' OR p_type_name.value_string LIKE '%Sprinkler%' OR p_type_name.value_string LIKE '%Wet%' OR p_type_name.value_string LIKE '%Deluge%')
        ) > 20 THEN 'Fire Protection'

        WHEN (
            SELECT COUNT(*) 
            FROM elements e_pipe 
            JOIN element_parameters p_sys_ref ON e_pipe.element_id = p_sys_ref.element_id 
            JOIN parameter_catalog pc_sys_ref ON p_sys_ref.parameter_id = pc_sys_ref.parameter_id
            JOIN elements e_system ON p_sys_ref.value_int = e_system.element_id
            JOIN element_parameters p_type_name ON e_system.element_id = p_type_name.element_id
            JOIN parameter_catalog pc_type_name ON p_type_name.parameter_id = pc_type_name.parameter_id
            
            WHERE e_pipe.category_name = 'Pipes' 
            AND pc_sys_ref.parameter_name = 'System Type'
            AND pc_type_name.parameter_name = 'Type Name'
            AND (p_type_name.value_string LIKE '%Hydronic%' OR p_type_name.value_string LIKE '%Chilled%' OR p_type_name.value_string LIKE '%Mechanical%')
        ) > 20 THEN 'Mechanical (Piping)'
        
        -- 2. Fallback to broad Category Counting (for ARC/STR or generic models)
        WHEN (SELECT COUNT(*) FROM elements WHERE category_name = 'Pipes') > (SELECT COUNT(*) FROM elements WHERE category_name IN ('Walls', 'Ducts', 'Structural Columns')) * 2 THEN 'Plumbing (General)'
        WHEN (SELECT COUNT(*) FROM elements WHERE category_name = 'Ducts') > 20 THEN 'Mechanical (HVAC)'
        WHEN (SELECT COUNT(*) FROM elements WHERE category_name = 'Structural Columns') > 20 THEN 'Structure'
        WHEN (SELECT COUNT(*) FROM elements WHERE category_name = 'Walls') > 50 THEN 'Architecture'
        WHEN (SELECT COUNT(*) FROM elements WHERE category_name IN ('Wires', 'Conduits', 'Cable Trays')) > 50 THEN 'Electrical'
        
        ELSE 'General / Multi-Discipline'
    END as InferredDiscipline,
    
    -- Element ID (for reference)
    e.element_id

FROM elements e
