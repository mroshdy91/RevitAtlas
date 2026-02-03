SELECT 
    COALESCE(
        (SELECT value_string FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'Sheet Number' LIMIT 1),
        '???'
    ) as SheetNumber,
    COALESCE(
        (SELECT value_string FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'Sheet Name' LIMIT 1),
        'Unnamed Sheet'
    ) as SheetName
FROM elements e
WHERE e.category_name = 'Sheets'
  -- Filter out placeholder sheets
  AND EXISTS (SELECT 1 FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE ep.element_id = e.element_id AND pc.parameter_name = 'Sheet Number' AND ep.value_string != '')
ORDER BY SheetNumber ASC
