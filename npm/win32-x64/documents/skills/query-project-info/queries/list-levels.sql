SELECT 
    COALESCE(
        (SELECT value_string FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'Name' LIMIT 1),
        'Unnamed Level'
    ) as LevelName,
    COALESCE(
        (SELECT value_double FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'Elevation' LIMIT 1),
        0
    ) as Elevation
FROM elements e
WHERE e.category_name = 'Levels'
  -- Filter out internal markers with no name
  AND EXISTS (SELECT 1 FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'Name' AND ep.value_string != '')
ORDER BY Elevation DESC
