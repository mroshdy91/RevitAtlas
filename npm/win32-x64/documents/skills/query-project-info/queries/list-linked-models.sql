SELECT 
    COALESCE(p_type.value_string, 'Unknown Link') as LinkName,
    COALESCE(p_file.value_string, 'Unknown File') as LinkFileName
FROM elements e

-- Join to get Type Name (ID: -1002001) - Use as Link Name
LEFT JOIN element_parameters p_type ON e.element_id = p_type.element_id AND p_type.parameter_id = -1002001

-- Join to get File Name (ID: -1007726) - Use as Reference Path
LEFT JOIN element_parameters p_file ON e.element_id = p_file.element_id AND p_file.parameter_id = -1007726

WHERE e.category_name = 'RVT Links'
ORDER BY LinkName ASC
