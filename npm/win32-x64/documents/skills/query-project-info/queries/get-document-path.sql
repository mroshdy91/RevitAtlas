SELECT 
    COALESCE(
        (SELECT value_string FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'File Path' LIMIT 1),
        'Unknown Path'
    ) as MainDocumentPath
FROM elements e
WHERE e.category_name = 'Sheets'
LIMIT 1
