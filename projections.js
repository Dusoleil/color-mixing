import {vec3} from "glMatrix"

export function point_to_point_distance(p1,p2)
{
    return vec3.distance(p1,p2);
}

export function barycentric_point(p,c)
{
    return 1;
}

export function scalar_project_onto_line(p,l1,l2)
{
    let a = vec3.create();
    vec3.subtract(a,p,l1);
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = vec3.dot(a,b);
    return scalar_proj;
}

export function project_onto_line(p,l1,l2)
{
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = scalar_project_onto_line(p,l1,l2);
    let proj = vec3.create();
    vec3.scale(proj,b,scalar_proj);
    vec3.add(proj,proj,l1);
    return proj;
}

export function barycentric_line(p,l)
{
    let scalar = scalar_project_onto_line(p,l[0],l[1]);
    let dist = point_to_point_distance(l[0],l[1]);
    let b1 = scalar / dist;
    let b0 = 1 - b1;
    return [b0,b1];
}

export function calculate_1_setpoint(old_sp,current_bary,target_bary)
{
    if(old_sp[0] <= 0) return target_bary;
    if(old_sp[1] <= 0) return [old_sp[0],target_bary[1]];
    if(target_bary[0] <= 0) return [0,target_bary[1]];
    if(target_bary[0] >= 1) return [old_sp[0],0];
    if(target_bary[1] <= 0) return [old_sp[0],0];
    if(target_bary[1] >= 1) return [0,target_bary[1]];
    if(current_bary[0] <= 0) return [old_sp[0],target_bary[1]];
    if(current_bary[0] >= 1) return [old_sp[0],target_bary[1]];
    if(current_bary[1] <= 0) return [old_sp[0],target_bary[1]];
    if(current_bary[1] >= 1) return [old_sp[0],target_bary[1]];
    let old_sp_ratio = old_sp[0]/old_sp[1];
    let target_bary_ratio = target_bary[0]/target_bary[1];
    let current_bary_ratio = current_bary[0]/current_bary[1];
    let mult = old_sp_ratio / current_bary_ratio;
    let new_sp_ratio = mult * target_bary_ratio;
    let new_sp = [old_sp[0],old_sp[0]/new_sp_ratio];
    return new_sp;
}

export function point_to_line_distance(p,l1,l2)
{
    let projection = project_onto_line(p,l1,l2);
    return point_to_point_distance(p,projection);
}

export function angle_between_lines(a1,a2,b1,b2)
{
    let a = vec3.create();
    vec3.subtract(a,a2,a1);
    let b = vec3.create();
    vec3.subtract(b,b2,b1);
    let t = vec3.angle(a,b);
    return t;
}

export function angle_between_lines_q1(a1,a2,b1,b2)
{
    let t = angle_between_lines(a1,a2,b1,b2);
    if(t>(Math.PI/2))
        t = Math.PI - t;
    return t;
}

export function rad_to_deg(t)
{
    return t * (180/Math.PI);
}