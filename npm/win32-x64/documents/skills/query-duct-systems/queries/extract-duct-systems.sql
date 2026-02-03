SELECT 
    e.document_id,
    
    -- 1. System Type (Descriptive)
    COALESCE(p_sys_class.value_string, p_sys_name.value_string, 'Undefined') as SystemName,
    
    -- 2. Level Name
    COALESCE(e.level_name, 'Unassigned') as LevelName,

    -- 3. Component Type (Straight vs Fitting)
    CASE 
        WHEN e.category_name = 'Ducts' THEN 'Straight'
        WHEN e.category_name IN ('Duct Fittings', 'Duct Accessories') THEN 'Fitting'
        ELSE 'Other'
    END as ComponentType,
    
    -- 4. Shape Classification (Rectangular / Round / Oval)
    CASE 
        WHEN (e.family_name LIKE '%Round%' OR e.type_name LIKE '%Round%' OR dia_param.value_double IS NOT NULL) AND w_param.value_double IS NULL THEN 'Round'
        WHEN (e.family_name LIKE '%Oval%' OR e.type_name LIKE '%Oval%') THEN 'Oval'
        WHEN (e.family_name LIKE '%Rectangular%' OR e.type_name LIKE '%Rectangular%' OR (w_param.value_double IS NOT NULL AND h_param.value_double IS NOT NULL)) THEN 'Rectangular'
        ELSE 'Unknown Shape'
    END as Shape,
    
    -- 5. Duct Surface Area (m2)
    ROUND(SUM(COALESCE(area_duct.value_double, area_fitting.value_double, 0)) * 0.092903, 2) as DuctAreaM2,

    -- 6. Insulation Area (m2) - Only if Insulation Thickness > 0
    ROUND(SUM(CASE WHEN COALESCE(ins_thk_1.value_double, ins_thk_2.value_double, 0) > 0 
              THEN COALESCE(area_duct.value_double, area_fitting.value_double, 0) ELSE 0 END) * 0.092903, 2) as InsulationAreaM2,

    -- 7. Lining Area (m2) - Only if Lining Thickness > 0
    ROUND(SUM(CASE WHEN COALESCE(lin_thk_1.value_double, lin_thk_2.value_double, 0) > 0 
              THEN COALESCE(area_duct.value_double, area_fitting.value_double, 0) ELSE 0 END) * 0.092903, 2) as LiningAreaM2

FROM elements e
-- System Classification (-1140325)
LEFT JOIN element_parameters p_sys_class ON e.document_id = p_sys_class.document_id AND e.element_id = p_sys_class.element_id AND p_sys_class.parameter_id = -1140325
-- System Name (-1140324)
LEFT JOIN element_parameters p_sys_name ON e.document_id = p_sys_name.document_id AND e.element_id = p_sys_name.element_id AND p_sys_name.parameter_id = -1140324

-- Shape Determination Parameters
-- Diameter (-1140225)
LEFT JOIN element_parameters dia_param ON e.document_id = dia_param.document_id AND e.element_id = dia_param.element_id AND dia_param.parameter_id = -1140225
-- Width (1112505)
LEFT JOIN element_parameters w_param ON e.document_id = w_param.document_id AND e.element_id = w_param.element_id AND w_param.parameter_id = 1112505
-- Height (1112506)
LEFT JOIN element_parameters h_param ON e.document_id = h_param.document_id AND e.element_id = h_param.element_id AND h_param.parameter_id = 1112506

-- Area Parameters
-- Duct Area (-1114120)
LEFT JOIN element_parameters area_duct ON e.document_id = area_duct.document_id AND e.element_id = area_duct.element_id AND area_duct.parameter_id = -1114120
-- Fitting Area (-1012805)
LEFT JOIN element_parameters area_fitting ON e.document_id = area_fitting.document_id AND e.element_id = area_fitting.element_id AND area_fitting.parameter_id = -1012805

-- Insulation Thickness (-1150431, -1114359)
LEFT JOIN element_parameters ins_thk_1 ON e.document_id = ins_thk_1.document_id AND e.element_id = ins_thk_1.element_id AND ins_thk_1.parameter_id = -1150431
LEFT JOIN element_parameters ins_thk_2 ON e.document_id = ins_thk_2.document_id AND e.element_id = ins_thk_2.element_id AND ins_thk_2.parameter_id = -1114359

-- Lining Thickness (-1150433, -1114360)
LEFT JOIN element_parameters lin_thk_1 ON e.document_id = lin_thk_1.document_id AND e.element_id = lin_thk_1.element_id AND lin_thk_1.parameter_id = -1150433
LEFT JOIN element_parameters lin_thk_2 ON e.document_id = lin_thk_2.document_id AND e.element_id = lin_thk_2.element_id AND lin_thk_2.parameter_id = -1114360

WHERE e.category_name IN ('Ducts', 'Duct Fittings', 'Duct Accessories')
GROUP BY 1, 2, 3, 4, 5
ORDER BY SystemName, LevelName, ComponentType, Shape
