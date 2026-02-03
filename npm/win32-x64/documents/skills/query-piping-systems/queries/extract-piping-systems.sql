SELECT 
    e.document_id,
    -- 1. Descriptive System Name (mapped from abbreviation)
    COALESCE(ps.type_name, p_sys_name.value_string, 'Undefined') as SystemName,
    
    -- 2. Physical Material (resolved via ElementId reference)
    COALESCE(NULLIF(mat_param.value_string, ''), NULLIF(e.type_name, ''), 'Unassigned') as Material,
    
    -- 3. Resilient Size Mapping
    COALESCE(size_param.value_string, overall_param.value_string, dia_param.value_string, 'Unknown Size') as PipeSize,
    
    -- 4. Aggregated Length (Meters)
    ROUND(SUM(e.param_length) * 0.3048, 2) as TotalLengthMeters
FROM elements_global e
-- Join to clarify System Abbreviation (ID: -1140324)
JOIN element_parameters_global p_sys_name ON e.document_id = p_sys_name.document_id AND e.element_id = p_sys_name.element_id AND p_sys_name.parameter_id = -1140324
-- Join Piping Systems category to get descriptive type_name
LEFT JOIN (
    SELECT p.document_id, p.value_string, el.type_name
    FROM element_parameters_global p
    JOIN elements_global el ON p.document_id = el.document_id AND p.element_id = el.element_id
    WHERE p.parameter_id = -1140324 AND el.category_name = 'Piping Systems'
) ps ON e.document_id = ps.document_id AND ps.value_string = p_sys_name.value_string
-- Multi-parameter Size lookup
LEFT JOIN element_parameters_global size_param ON e.document_id = size_param.document_id AND e.element_id = size_param.element_id AND size_param.parameter_id = -1114240
LEFT JOIN element_parameters_global overall_param ON e.document_id = overall_param.document_id AND e.element_id = overall_param.element_id AND overall_param.parameter_id = -1150434
LEFT JOIN element_parameters_global dia_param ON e.document_id = dia_param.document_id AND e.element_id = dia_param.element_id AND dia_param.parameter_id = -1140225
-- Correct Material Resolution (Physical Name)
LEFT JOIN element_parameters_global ep_ref ON e.document_id = ep_ref.document_id AND e.element_id = ep_ref.element_id 
    AND ep_ref.parameter_id = (SELECT parameter_id FROM parameter_catalog_global WHERE parameter_name = 'Material' LIMIT 1)
LEFT JOIN element_parameters_global mat_param ON ep_ref.document_id = mat_param.document_id AND ep_ref.value_int = mat_param.element_id 
    AND mat_param.parameter_id = (SELECT parameter_id FROM parameter_catalog_global WHERE parameter_name = 'Name' LIMIT 1)

WHERE e.category_name = 'Pipes'
GROUP BY ALL
ORDER BY e.document_id, SystemName, TotalLengthMeters DESC
